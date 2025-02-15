import Streams from '../helpers/Streams';
import { Subject, BehaviorSubject, switchMap, shareReplay, map, catchError, of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { routes, connectionOptions } from '../consts/index.js';

export default class Connection extends Streams {
	#token = null;

	constructor() {
		super();
		this.server = routes.server;
		this.paths = routes.serverPaths;
		this.headers = {
   		'Content-Type': 'application/json;charset=utf-8'
  	}
	}

	async init() {
		this.#createStreams();
		this.#subscribeToStreams();
	}

	#createStreams() {
	}

	#subscribeToStreams() {
	}

	setAccessToken(tokens) {
		this.#token = tokens.access;
	}

	removeAccessToken() {
		this.#token = null;
	}

	async requestToServer(requestData) {
		const response = {
			success: false,
			error: null,
			data: null,
			refreshed: false,
			tokens: null,
		}

		try {			
			const { target, action, tokens, data = {} } = requestData;
			const path = `${this.paths.target[target]}/${this.paths.action[action]}`;

			const method = connectionOptions.method[action];

			const headers = {
				...this.headers,
				'Authorization': `Bearer ${tokens.access}`
			}
	
			const body = JSON.stringify({
				...data,
				refresh: tokens.refresh,
			})
			
			const requestUrl = `${this.server}${path}`;
			const requestOptions =  {
				headers,
	  		method,
	  		body: requestBody,
			}

			const responseFromServerJSON = await fetch(requestUrl, requestOptions)

			const responseFromServer = await responseFromServerJSON.json();

			if(!responseFromServer.success) {
				response.error.type = responseFromServer.error;
			}

			if(responseFromServer.success) {
				response.success = true;
				response.data = responseFromServer.data;
			}

			if(responseFromServer.tokens.refreshed) {
				response.tokens = responseFromServer.tokens;
			}
	
		} catch(err) {
			response.error.type = `request`;
			response.error.description = err;
			console.log(`Сервер недоступен: ${err}`)

		} finally {
			return response;
		}

	}


	async #sendRequestToServer(request) {
		const requestToServer = ajax(request).pipe(
			map(value => value.response),			
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

}