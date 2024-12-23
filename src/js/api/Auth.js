import Streams from '../helpers/Streams';
import getFingerPrint from '../helpers/getFingerPrint.js';
import { routes, authVariables } from '../consts/index.js';
import { ajax } from 'rxjs/ajax';
import { Subject, switchMap, catchError, of, map, timer } from 'rxjs';

export default class Auth extends Streams {
	#rememberUser = false;
	#fingerPrint = false;
	#storageToken = authVariables.storageToken;

	constructor() {
		super();
		this.server = routes.server;
		this.path = routes.auth;
		this.headers = {
			'Content-Type': 'application/json;charset=utf-8'
		}
	}

	async init() {
		this.#createStreams();
		this.#subscribeToStreams();
		await this.#getFingerPrint();
	}

	#createStreams() {
		const requestTokensFromServer = new Subject().pipe(
      switchMap((value) => value)
		)
		this.saveStream(`requestTokensFromServer`, requestTokensFromServer);

		const timerRefreshTokens = timer(720000, 720000);
		this.saveStream(`timerRefreshTokens`, timerRefreshTokens)

		this.saveStream(`successRefreshTokens`, new Subject());
		this.saveStream(`errorRefreshTokens`, new Subject());
	}

	#subscribeToStreams() {
		this.subscribeToStream(`timerRefreshTokens`, this.requestRefreshTokens.bind(this));
		this.subscribeToStream(`requestTokensFromServer`, this.#onResponseRefreshToken.bind(this));
		this.subscribeToStream(`successRefreshTokens`, this.saveRefreshToken.bind(this));
		this.subscribeToStream(`errorRefreshTokens`, this.#removeTokenFromStorage.bind(this))
	}

	async #getFingerPrint() {
		const visitorPrint = await getFingerPrint();
		this.#fingerPrint = visitorPrint.visitorId;
	}

	saveRefreshToken(tokens) {
		if(!tokens) {
			console.log(`empty data`);
			return;
		}

		const currentStorage = this.#rememberUser === false ?
			sessionStorage :
			localStorage

		const refreshToken = JSON.stringify(tokens.refresh)
		currentStorage.setItem(this.#storageToken, refreshToken)
	}

	getRefreshToken() {
		return this.#loadTokenFromStorage()
	}

	#loadTokenFromStorage() {
		const loadedTokenJSONFromStorage = localStorage.getItem(this.#storageToken);

		const loadedTokenJSON = loadedTokenJSONFromStorage ?
			loadedTokenJSONFromStorage :
			sessionStorage.getItem(this.#storageToken);

		const loadedToken = loadedTokenJSON ?
			JSON.stringify(loadedTokenJSON) :
			null;

		return loadedToken;
	}

	#removeTokenFromStorage(storage) {
		if(storage) {
			const currentStorage = storage === `session` ?
				sessionStorage :
				localStorage;

			currentStorage.removeItem(this.#storageToken);

			return;
		}

		sessionStorage.removeItem(this.#storageToken);
		localStorage.removeItem(this.#storageToken);
	}

	async requestRefreshTokens(refreshToken) {
		const token = refreshToken ?
			refreshToken :
			this.#loadTokenFromStorage();

		if(!token) {
			console.log(`empty token`)
		}

		const url = `${this.server}${this.path.refreshTokens}`;

		const request = {
			url: url,
			method: `POST`,
			headers: this.headers,
			body: {
				token: token,
				fingerPrint: this.#fingerPrint,
			}
		}
	
		const requestToServer = ajax(request).pipe(
			map(value => value.response),
			catchError(err => {
				return of({
					success: false,
					error: {
						type: `request`,
						description: err.message,
					}
				})
			})
		)

		this.addDataToStream(`requestTokensFromServer`, requestToServer)
	}

	#onResponseRefreshToken(response) {
		if(response.success && response.tokens) {
			this.saveRefreshToken(response.tokens.refresh);
			this.addDataToStream(`successRefreshTokens`, response.tokens)
			return
		}

		if(!response.success) {
			if(response.error.type === `token`) {
				this.#removeTokenFromStorage(`local`);
				this.#removeTokenFromStorage(`session`);
			}

			this.addDataToStream(`errorRefreshTokens`, response.error);
			return;
		}
	}

	rememberUser() {
		this.#rememberUser = true;
	}

	removeUser() {
		this.#rememberUser = false;
		this.#removeTokenFromStorage(`local`);
	}
}