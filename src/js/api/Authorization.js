import Streams from '../helpers/Streams';
import getFingerPrint from '../helpers/getFingerPrint.js';
import { routes, authVariables } from '../consts/index.js';
import { ajax } from 'rxjs/ajax';
import { Subject, switchMap, catchError, of, map, timer } from 'rxjs';

export default class Authorization extends Streams {
  #fingerPrint = false;
  #storageToken = authVariables.storageToken;

  constructor() {
    super();
    this.server = routes.server;
    this.path = routes.auth;
    this.headers = {
      'Content-Type': 'application/json;charset=utf-8',
    };
    this.subscribeOnRefreshTimer = null;
    this.awaitingRefreshingToken = null;
    this.rememberUser = false;
  }

  async init() {
    this.#createStreams();
    this.#subscribeToStreams();
    await this.#getFingerPrint();
  }

  #createStreams() {
    const timerRefreshTokens = timer(720000, 720000);
    this.saveStream(`timerRefreshTokens`, timerRefreshTokens);

    this.saveStream(`successRefreshTokens`, new Subject());
    this.saveStream(`errorRefreshTokens`, new Subject());
  }

  #subscribeToStreams() {
    this.subscribeToStream(
      `successRefreshTokens`,
      this.saveRefreshToken.bind(this),
    );
    this.subscribeToStream(
      `errorRefreshTokens`,
      this.removeRefreshToken.bind(this),
    );
  }

  async #getFingerPrint() {
    const visitorPrint = await getFingerPrint();
    this.#fingerPrint = visitorPrint.visitorId;
  }

  getRefreshToken() {
    return this.#loadRefreshTokenFromStorage();
  }

  saveRefreshToken(tokens) {
    this.#saveRefreshTokenToStorage(tokens);
  }

  removeRefreshToken() {
    this.#removeTokenFromStorage();
  }

  #saveRefreshTokenToStorage(tokens) {
    if (!tokens) {
      return;
    }

    const currentStorage =
      this.rememberUser === false ? sessionStorage : localStorage;

    const refreshToken = JSON.stringify(tokens.refresh);
    currentStorage.setItem(this.#storageToken, refreshToken);
  }

  switchRememberUser(user) {
    this.rememberUser = user.remember;
  }

  #loadRefreshTokenFromStorage() {
    const loadedTokenJSONFromStorage = localStorage.getItem(this.#storageToken);

    const loadedTokenJSON = loadedTokenJSONFromStorage
      ? loadedTokenJSONFromStorage
      : sessionStorage.getItem(this.#storageToken);

    const loadedToken = loadedTokenJSON ? JSON.parse(loadedTokenJSON) : null;

    return loadedToken;
  }

  #removeTokenFromStorage(storage) {
    if (storage) {
      const currentStorage =
        storage === `session` ? sessionStorage : localStorage;

      currentStorage.removeItem(this.#storageToken);

      return;
    }

    sessionStorage.removeItem(this.#storageToken);
    localStorage.removeItem(this.#storageToken);
  }

  async requestRefreshTokens() {
    const response = {
      success: false,
      error: null,
    };

    if (this.awaitingRefreshingToken) {
      clearTimeout(this.awaitingRefreshingToken);
      this.awaitingRefreshingToken = null;
    }

    const token = this.#loadRefreshTokenFromStorage();

    if (!token) {
      return;
    }

    if (!this.#fingerPrint) {
      await this.#getFingerPrint();
    }

    try {
      const requestUrl = `${this.server}${this.path.refreshTokens}`;
      const requestBody = JSON.stringify({
        refreshToken: token,
        fingerPrint: this.#fingerPrint,
      });

      const requestOptions = {
        headers: this.headers,
        method: `POST`,
        body: requestBody,
      };

      const responseFromServerJSON = await fetch(requestUrl, requestOptions);

      if (!responseFromServerJSON.ok) {
        throw `Server error`;
      }

      const responseFromServer = await responseFromServerJSON.json();

      if (!responseFromServer.success) {
        this.addDataToStream(`errorRefreshTokens`, responseFromServer.error);
        response.error = responseFromServer.error;

        return response;
      }

      if (responseFromServer.success) {
        this.addDataToStream(`successRefreshTokens`, responseFromServer.tokens);
        response.success = true;

        return response;
      }
    } catch (err) {
      const requestRefreshTokensBinded = this.requestRefreshTokens.bind(this);
      this.awaitingRefreshingToken = setTimeout(
        requestRefreshTokensBinded,
        150000,
      );

      response.error =
        err === `Server error` ? `Server error` : `Unknown error`;

      return response;
    }
  }

  switchRefreshingTokensByStatus(network) {
    network === `online`
      ? this.startRefreshingTokensByTime()
      : this.stopRefreshingTokensByTime();
  }

  startRefreshingTokensByTime() {
    if (this.subscribeOnRefreshTimer) {
      this.unSubscribeFromStream(
        `timerRefreshTokens`,
        this.subscribeOnRefreshTimer,
      );
    }
    this.subscribeOnRefreshTimer = this.subscribeToStream(
      `timerRefreshTokens`,
      this.requestRefreshTokens.bind(this),
    );
  }

  stopRefreshingTokensByTime() {
    if (this.subscribeOnRefreshTimer) {
      this.unSubscribeFromStream(
        `timerRefreshTokens`,
        this.subscribeOnRefreshTimer,
      );
      this.subscribeOnRefreshTimer = null;
    }
  }

  removeUser() {
    this.rememberUser = false;
    this.#removeTokenFromStorage(`local`);
  }
}
