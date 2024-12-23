import Streams from '../helpers/Streams'
import { Subject } from 'rxjs';
import { routes, actionSSEMessages } from  '../consts/index.js';

export default class SSE extends Streams {
	constructor(test) {
		super();
		this.route = `${routes.server}${routes.sse}`;
		this.connect = null;
	}

	init() {
		this.#createStreams();
		this.#subscribeToStreams();
	}

	async connection(token) {
		if(!token) {
			return;
		}

		this.connect = new EventSource(`${this.route}?token=${token}`);
		this.connect.onmessage = this.#onComingMessage.bind(this);
		this.connect.onopen = this.#onOpenConnection.bind(this);
		this.connect.onerror = this.#onErrorConnection.bind(this);
	}

	#createStreams() {
		this.saveStream(`commingMessage`, new Subject())

		for(let key in actionSSEMessages) {
			this.saveStream(key, new Subject());
		}
	}

	#subscribeToStreams() {}

	#onComingMessage(message) {
		try {
			const data = JSON.parse(message.data);

			this.addDataToStream(`commingMessage`, {
				action: data.action,
				message: data.body,
			})
		
		} catch (err) {
			console.log(`Fail response data from server`)
		}
	}

	#onOpenConnection(event) {
		return true;
	}

	#onErrorConnection(event) {
		console.log(`Error connection with server sse`);
		return false;
	}
}