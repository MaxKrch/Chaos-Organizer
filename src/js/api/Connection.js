import Streams from '../helpers/Streams';
import { Subject, BehaviorSubject, switchMap, shareReplay, map, catchError, of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { routes, connectionOptions } from '../consts/index.js';

export default class Connection extends Streams {
	constructor() {
		super();
		this.server = routes.server;
		this.path = routes.serverPath;
		this.headers = {
   		'Content-Type': 'application/json;charset=utf-8'
  	}
	}

	async init() {
		this.#createStreams();
		this.#subscribeToStreams();

		this.requestToServer({
			target: `notes`,
			action: `get`,
			body: {
				category: `favorites`,
				tagId: null,
				lastNoteId: null,
				includLastId: false,
				direction: `preview`,
			},
			token: `65544545444fdfdsf4s5df`
		})

		this.retryAwaitingRequest(5)
	}

	#createStreams() {
		const requestToServer = new Subject().pipe(
      switchMap((value) => value)
		)
		this.saveStream(`requestToServer`, requestToServer);
		this.saveStream(`awaitingRequest`, new BehaviorSubject(null));
		this.saveStream(`successRequestData`, new Subject()); 
		this.saveStream(`errorRequestData`, new Subject());
		this.saveStream(`errorAccessToken`, new Subject());
	}

	#subscribeToStreams() {
		this.subscribeToStream(`requestToServer`, this.#onResponseFromServer.bind(this))
	}

	#onResponseFromServer(data) {
		try {
			const response = data.response || data;

			if(response.success) {
				this.addDataToStream(`successRequestData`, response.data);
				this.removeAwaitingRequest();
				return;
			}

			if(!response.success) {
				if(response.error.type === `request`) {
					this.addDataToStream(`errorRequestData`, response.error.description);
					return;
				}

				if(response.error.type === `token`); {
					this.addDataToStream(`errorAccessToken`, response.error.description);
					return;
				}
			} 
		} catch(err) {
			console.log(`unknown error: ${err}`);
		}
	}

	async requestToServer(data) {
		const request = this.#createRequest(data) 
		this.saveAwaitingRequest(request);
		this.#sendRequestToServer(request);
	}

	async retryAwaitingRequest(token) {
		const awaitingRequest = this.#getAwaitingRequest();
		if(!awaitingRequest) {
			return;
		}
		awaitingRequest.headers.Authorization = `Bearer ${token}`;
		this.#sendRequestToServer(awaitingRequest);
	}

	async #sendRequestToServer(request) {
		const requestToServer = await ajax(request).pipe(
			catchError((err) => {
				return of({
					success: false,
					error: {
						type: `request`,
						description: err.message,
					},
				})
			})
		);

		this.addDataToStream(`requestToServer`, requestToServer)
	}

	#getAwaitingRequest() {
		return this.streams.awaitingRequest.stream$.getValue();
	}

	saveAwaitingRequest(request) {
		this.addDataToStream(`awaitingRequest`, request)
	}

	removeAwaitingRequest() {
		this.addDataToStream(`awaitingRequest`, null)
	}


	#createRequest(data) {
		try {			
			const { target, action,	body, token } = data;
			const path = `${this.path[target]}/${this.path[action]}`;
			const url = `${this.server}${path}`;
			const method = connectionOptions.method[action];

			const headers = {
				...this.headers,
				'Authorization': `Bearer ${token}`
			}

			const request = {
				url,
	  		method,
	  		headers,
	  		body,
	  	}

			return request
	
		} catch(err) {
			console.log(`Incorrect options request: ${err}`);

			return false;
		}
	}
}