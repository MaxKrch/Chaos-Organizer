import Streams from '../helpers/Streams';
import {
  Subject,
  BehaviorSubject,
  switchMap,
  shareReplay,
  map,
  catchError,
  of,
} from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { routes, connectionOptions } from '../consts/index.js';

export default class Connection extends Streams {
  #token = null;

  constructor() {
    super();
    this.server = routes.server;
    this.paths = routes.serverPaths;
    this.headers = {
      form: {},
      json: {
        'Content-Type': 'application/json;charset=utf-8',
      },
    };
  }

  async init() {
    this.#createStreams();
    this.#subscribeToStreams();
  }

  #createStreams() {}

  #subscribeToStreams() {}

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
    };

    try {
      const { target, type, body, method, urlOptions = null } = requestData;
      let requestUrl = `${this.server}${this.paths[target]}`;

      if (urlOptions) {
        requestUrl += urlOptions;
      }

      const headers = {
        ...this.headers[type],
        Authorization: `Bearer ${this.#token}`,
      };
      const requestOptions = {
        headers,
        method,
        body,
      };

      if (requestData.signal) {
        requestOptions.signal = requestData.signal;
      }

      const responseFromServerJSON = await fetch(requestUrl, requestOptions);

      if (!responseFromServerJSON.ok) {
        response.error = `Server error`;
        return response;
      }

      const responseFromServer = await responseFromServerJSON.json();

      if (!responseFromServer.success) {
        response.error = responseFromServer.error;
        return response;
      }

      response.data = responseFromServer.data;
      response.success = true;
      return response;
    } catch (err) {
      response.error =
        err.name === `AbortError` ? `AbortError` : `Unknown error`;

      return response;
    }
  }

  async #sendRequestToServer(request) {
    const requestToServer = ajax(request).pipe(
      map((value) => value.response),
      catchError((err) => {
        return of({
          success: false,
          error: {
            type: `request`,
            description: err.message,
          },
        });
      }),
    );

    this.addDataToStream(`requestToServer`, requestToServer);
  }
}
