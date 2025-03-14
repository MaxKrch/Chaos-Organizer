import Streams from '../helpers/Streams';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { Subject } from 'rxjs';
import { routes, SSEMessageEvents } from '../consts/index.js';

export default class SSE extends Streams {
  #token = null;

  constructor() {
    super();
    this.route = `${routes.server}${routes.sse}`;
    this.connection = null;
    this.abortCtrl = null;
    this.clientId = null;
  }

  init() {
    this.#createStreams();
    this.#subscribeToStreams();
  }

  #createStreams() {
    this.saveStream(`commingMessage`, new Subject());
    this.saveStream(`connectSSE`, new Subject());

    for (let key in SSEMessageEvents) {
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
    if (this.connection) return;

    const handlerOpenConnection = this.#onOpenConnection.bind(this);
    const handlerComingMessage = this.#onComingMessage.bind(this);
    const handlerErrorConnection = this.#onErrorConnection.bind(this);
    const handlerCloseConnection = this.#onCloseConnection.bind(this);

    this.abortCtrl = new AbortController();
    this.connection = new fetchEventSource(this.route, {
      headers: {
        Authorization: `Bearer ${this.#token}`,
        'Content-Type': 'application/json;charset=utf-8',
      },
      method: `POST`,
      body: JSON.stringify({
        id: this.clientId,
      }),
      signal: this.abortCtrl.signal,
      onopen(event) {
        handlerOpenConnection(event);
      },
      onmessage(event) {
        handlerComingMessage(event);
      },
      onerror(event) {
        handlerErrorConnection(event);
      },
      onclose(event) {
        handlerCloseConnection(event);
      },
    });
  }

  reConnect() {
    this.disConnect();
    this.connect();
  }

  disConnect() {
    if (this.abortCtrl) {
      this.abortCtrl.abort();
      this.abortCtrl = null;
    }

    this.connection = null;
  }

  #onComingMessage(message) {
    try {
      if (!message.event) return;

      if (message.event === `connect`) {
        const data = JSON.parse(message.data);
        this.clientId = data.id;
        return;
      }

      this.addDataToStream(`commingMessage`, {
        event: message.event,
        data: JSON.parse(message.data),
      });
    } catch (err) {
      console.log(err);
    }
  }

  #onOpenConnection() {
    console.log(`Open connection with server sse`);
    this.addDataToStream(`connectSSE`, {
      event: `connect`,
    });
  }

  #onErrorConnection(error) {
    if (error.name == `AbortError`) return;

    console.log(`Error connection with server sse`);
  }

  #onCloseConnection() {
    console.log(`Close connection with server sse`);
  }
}
