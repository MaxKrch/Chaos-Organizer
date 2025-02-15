import Streams from '../helpers/Streams';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { Subject } from 'rxjs';
import { routes, SSEMessageEvents } from  '../consts/index.js';

export default class SSE extends Streams {
	#token = null;

	constructor(test) {
		super();
		this.route = `${routes.server}${routes.sse}`;
		this.connection = null;
		this.abortCtrl = null;
	}

	init() {
		this.#createStreams();
		this.#subscribeToStreams();
	}

	#createStreams() {
		this.saveStream(`commingMessage`, new Subject())

		for(let key in SSEMessageEvents) {
			this.saveStream(key, new Subject());
		}
	}

	#subscribeToStreams() {}

	setAccessToken(tokens) {
		this.#token = tokens.access;
	}

	removeAccessToken() {
		this.#token = null;
	}

	connect() {
		if(this.connection) return;

		const handlerOpenConnection = this.#onOpenConnection.bind(this);
		const handlerComingMessage = this.#onComingMessage.bind(this);
		const handlerErrorConnection = this.#onErrorConnection.bind(this);
		const handlerCloseConnection = this.#onCloseConnection.bind(this);

		this.abortCtrl = new AbortController();
		this.connection = new fetchEventSource(this.route, {
			headers: {
   			'Authorization': `Bearer ${this.#token}`
  		},
  		signal: this.abortCtrl.signal,			
  		onopen (event) { 
  			handlerOpenConnection(event)
  		},
			onmessage (event) {
				handlerComingMessage(event)
			},
			onerror (event) { 
				handlerErrorConnection(event)
			},
			onclose (event) {
				handlerCloseConnection(event)
			}
		})
	}

	reConnect() {
		this.disConnect();
		this.connect();
	}
	
	disConnect() {
		if(this.abortCtrl) {
			this.abortCtrl.abort();
			this.abortCtrl = null;
		}
		
		this.connection = null;	
	}

	#onComingMessage(message) {
		try {
			this.addDataToStream(`commingMessage`, {
				event: message.event,
				data: JSON.parse(message.data),
			})
		
		} catch (err) {
			console.log(`Incorrect SSE message`)
		}
	}

	#onOpenConnection(event) {
		console.log(`Open connection with server sse`)
	}

	#onErrorConnection(event) {
		console.log(`Error connection with server sse`);
	}

	#onCloseConnection(event) {
		console.log(`Close connection with server sse`)
	}
}