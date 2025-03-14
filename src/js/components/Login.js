import BaseComponent from '../helpers/BaseComponent';
import {
  validateEmail,
  validatePassword,
} from '../helpers/validateLoginData.js';
import { routes, loginStreams } from '../consts/index.js';
import {
  Subject,
  map,
  fromEvent,
  throttleTime,
  debounceTime,
  merge,
  filter,
} from 'rxjs';
import getFingerPrint from '../helpers/getFingerPrint';

export default class Login extends BaseComponent {
  #namesStreams = loginStreams;
  #fingerPrint = null;

  constructor(container) {
    super(container);
    this.server = routes.server;
    this.paths = routes.auth;
    this.headers = {
      'Content-Type': 'application/json;charset=utf-8',
    };
    this.staticElements = {
      body: null,
      title: {
        register: null,
        login: null,
      },
      email: {
        input: null,
        error: null,
      },
      password: {
        input: null,
        error: null,
      },
      error: null,
      rememberUser: null,
      buttons: {
        cancel: null,
        register: null,
        login: null,
      },
    };
    this.abortControllers = {
      validateEmail: null,
    };
    this.messageTimeout = {
      loginErrorResponse: null,
    };
  }

  initionRender() {
    this.#renderElement();
    this.#saveStaticElements();
    this.#createStreams();
  }

  #renderElement() {
    this.element = document.createElement(`aside`);
    this.element.classList.add(`modal__overlay`, `login__overlay`);

    this.element.innerHTML = `
			<article class="modal__body login__container" data-id="loginBody" data-action="login">
					<div class="login__section login__target">
						<h2 class="modal__title login__target-title login__target-title_inactive" data-id="loginRegisterTitle" data-active-button="true" data-action="register">
							Регистрация 
						</h2>

						<h2 class="modal__title login__target-title" data-id="loginSigninTitle" data-active-button="false" data-action="login">
							Вход
						</h2>
					</div>

					<div class="login__section login__data">
						<label class="login__data-label">
							<div class="login__data-title">
								Email:
							</div>
						
							<input class="modal__input login__data-input" type="email" data-id="loginEmailInput" data-currect-data="false">
							
							<div class="login__data-error login__data-message" data-id="loginEmailError">
							</div>
						</label>

						<label class="login__data-label">
							<div class="login__data-title">
								Пароль:
							</div>
							<input class="modal__input login__data-input" type="password" data-id="loginPasswordInput" data-currect-data="false">
							
							<div class="login__data-error login__data-message" data-id="loginPasswordError">
							</div>	
						</label>
					</div>

					<label class="login__section login__remember" data-id="loginRememberUser">
						<div class="login__remember-text">
							Чужой компьютер:
						</div>
						
						<div class="slider-button login__remember-chek" data-id="loginRememberUserChek" data-remember-user="true">
							<div class="slider-button__switch">
								
							</div>
						</div>
					</label>

					<div class="login__section login__message" data-id="loginError" data-error="false">
					</div>
					
					<div class="login__section modal__buttons login__buttons">
						<button class="button login__button" data-id="loginCancel">
							Отмена
						</button>

						<button class="button login__button button_inactive hidden-item" data-id="loginRegister" data-active-button="false">
							Регистрация
						</button> 

						<button class="button login__button button_inactive" data-id="loginSignin" data-active-button="false">
							Вход
						</button>
					</div>	
				</article>
			</aside> `;
  }

  #saveStaticElements() {
    this.staticElements.body = this.element.querySelector(
      `[data-id="loginBody"]`,
    );

    this.staticElements.title.register = this.element.querySelector(
      `[data-id="loginRegisterTitle"]`,
    );
    this.staticElements.title.login = this.element.querySelector(
      `[data-id="loginSigninTitle"]`,
    );

    this.staticElements.email.input = this.element.querySelector(
      `[data-id="loginEmailInput"]`,
    );
    this.staticElements.email.error = this.element.querySelector(
      `[data-id="loginEmailError"]`,
    );

    this.staticElements.password.input = this.element.querySelector(
      `[data-id="loginPasswordInput"]`,
    );
    this.staticElements.password.error = this.element.querySelector(
      `[data-id="loginPasswordError"]`,
    );

    this.staticElements.error = this.element.querySelector(
      `[data-id="loginError"]`,
    );

    this.staticElements.rememberUser = this.element.querySelector(
      `[data-id="loginRememberUserChek"]`,
    );

    this.staticElements.buttons.cancel = this.element.querySelector(
      `[data-id="loginCancel"]`,
    );
    this.staticElements.buttons.register = this.element.querySelector(
      `[data-id="loginRegister"]`,
    );
    this.staticElements.buttons.login = this.element.querySelector(
      `[data-id="loginSignin"]`,
    );
  }

  async addElementToPage() {
    this.#createTempStreams();
    this.#subscribeToStreams();
    await this.#getFingerPrint();
    super.addElementToPage();
  }

  removeElementFromPage() {
    super.removeElementFromPage();
    this.clearDataPanel();
    this.#clearTempStreams();
    this.changeActionPanel(`login`);
  }

  async #getFingerPrint() {
    const visitorPrint = await getFingerPrint();
    this.#fingerPrint = visitorPrint.visitorId;
  }

  #createStreams() {
    this.#namesStreams.forEach((item) => {
      this.saveStream(item, new Subject());
    });
  }

  #createTempStreams() {
    const keyUpEnter = merge(
      fromEvent(this.staticElements.email.input, `keyup`),
      fromEvent(this.staticElements.password.input, `keyup`),
    ).pipe(
      throttleTime(350),
      filter((value) => value.key === `Enter` && !value.shiftKey),
    );
    this.saveStream(`keyUpEnter`, keyUpEnter);

    const requestClosePanel = merge(
      fromEvent(document, `mousedown`).pipe(
        filter((value) => !value.target.closest(`[data-id="loginBody"]`)),
      ),
      fromEvent(this.staticElements.buttons.cancel, `click`),
    );
    this.saveStream(`requestClosePanel`, requestClosePanel);

    const requestChangeActionPanel = merge(
      fromEvent(this.staticElements.title.register, `click`),
      fromEvent(this.staticElements.title.login, `click`),
    ).pipe(
      filter((value) => value.target.dataset.activeButton === `true`),
      throttleTime(150),
      map((value) => value.target.dataset.action),
    );
    this.saveStream(`requestChangeActionPanel`, requestChangeActionPanel);

    const inputEmail = fromEvent(this.staticElements.email.input, `input`).pipe(
      debounceTime(350),
      map((value) => value.target),
    );
    this.saveStream(`inputEmail`, inputEmail);

    const inputPassword = fromEvent(
      this.staticElements.password.input,
      `input`,
    ).pipe(
      debounceTime(350),
      map((value) => value.target),
    );
    this.saveStream(`inputPassword`, inputPassword);

    const requestSwitchRememberUser = fromEvent(
      this.staticElements.rememberUser,
      `click`,
    ).pipe(throttleTime(350));
    this.saveStream(`requestSwitchRememberUser`, requestSwitchRememberUser);

    const clicksOnRegisterButton = fromEvent(
      this.staticElements.buttons.register,
      `click`,
    ).pipe(
      throttleTime(150),
      filter((value) => value.target.dataset.activeButton === `true`),
      map((value) => value.target),
    );
    this.saveStream(`clicksOnRegisterButton`, clicksOnRegisterButton);

    const clicksOnLoginButton = fromEvent(
      this.staticElements.buttons.login,
      `click`,
    ).pipe(
      throttleTime(150),
      filter((value) => value.target.dataset.activeButton === `true`),
      map((value) => value.target),
    );
    this.saveStream(`clicksOnLoginButton`, clicksOnLoginButton);
  }

  #subscribeToStreams() {
    this.subscribeToStream(
      `requestClosePanel`,
      this.removeElementFromPage.bind(this),
    );

    this.subscribeToStream(
      `requestChangeActionPanel`,
      this.changeActionPanel.bind(this),
    );
    this.subscribeToStream(
      `requestSwitchRememberUser`,
      this.#switchRememberUser.bind(this),
    );

    this.subscribeToStream(`inputEmail`, this.#chekingEmail.bind(this));
    this.subscribeToStream(`inputPassword`, this.#chekingPassword.bind(this));

    this.subscribeToStream(`keyUpEnter`, this.#onKeyEnter.bind(this));
    this.subscribeToStream(
      `clicksOnRegisterButton`,
      this.#registerUser.bind(this),
    );
    this.subscribeToStream(
      `clicksOnLoginButton`,
      this.#authenticationByPassword.bind(this),
    );
  }

  #clearTempStreams() {
    for (let key in this.streams) {
      if (!this.#namesStreams.includes(key)) {
        this.clearSubscriptionsStream(key);
      }
    }
  }

  changeActionPanel(action) {
    this.clearDataPanel();

    const oldAction = action === `login` ? `register` : `login`;

    this.staticElements.body.dataset.action = action;

    this.#switchOnLoginTitle(action);
    this.#switchOffLoginTitle(oldAction);

    this.#showConfirmButton(action);
    this.#hideConfirmButton(oldAction);
  }

  #switchOnLoginTitle(action) {
    const currentTitleElement = this.staticElements.title[action];

    if (!currentTitleElement) {
      console.log(`empty element`);
      return;
    }

    currentTitleElement.classList.remove(`login__target-title_inactive`);
    currentTitleElement.dataset.activeButton = false;
  }

  #switchOffLoginTitle(action) {
    const currentTitleElement = this.staticElements.title[action];

    if (!currentTitleElement) {
      console.log(`empty element`);
      return;
    }

    currentTitleElement.classList.add(`login__target-title_inactive`);
    currentTitleElement.dataset.activeButton = true;
  }

  #showConfirmButton(action) {
    const currentButtonElement = this.staticElements.buttons[action];

    if (!currentButtonElement) {
      console.log(`empty element`);
      return;
    }

    currentButtonElement.classList.remove(`hidden-item`);
    this.#disableConfirmButton(action);
  }

  #hideConfirmButton(action) {
    const currentButtonElement = this.staticElements.buttons[action];

    if (!currentButtonElement) {
      console.log(`empty element`);
      return;
    }

    currentButtonElement.classList.add(`hidden-item`);
  }

  #showEmailError(error) {
    this.staticElements.email.input.classList.remove(`input-value_good`);
    this.staticElements.email.input.classList.add(`input-value_bad`);

    this.staticElements.email.error.classList.add(`login__data-message_error`);

    this.staticElements.email.error.textContent = error;
  }

  #clearEmailError() {
    if (this.staticElements.email.input.value.trim().length > 0) {
      this.staticElements.email.input.classList.add(`input-value_good`);
    }

    this.staticElements.email.input.classList.remove(`input-value_bad`);

    this.staticElements.email.error.classList.remove(
      `login__data-message_error`,
    );
    this.staticElements.email.error.textContent = ``;
  }

  #showEmailMessage(message) {
    this.staticElements.email.error.textContent = message;
  }

  #clearEmailMessage() {
    this.staticElements.email.error.textContent = ``;
  }

  #showPasswordError(error) {
    this.staticElements.password.input.classList.remove(`input-value_good`);
    this.staticElements.password.input.classList.add(`input-value_bad`);

    this.staticElements.password.error.classList.add(
      `login__data-message_error`,
    );
    this.staticElements.password.error.textContent = error;
  }

  #clearPasswordError() {
    if (this.staticElements.password.input.value.trim().length > 0) {
      this.staticElements.password.input.classList.add(`input-value_good`);
    }
    this.staticElements.password.input.classList.remove(`input-value_bad`);

    this.staticElements.password.error.classList.remove(
      `login__data-message_error`,
    );
    this.staticElements.password.error.textContent = ``;
  }

  #switchRememberUser() {
    const oldState = this.staticElements.rememberUser.dataset.rememberUser;

    oldState === `true`
      ? this.#disableRememberUser()
      : this.#enableRememberUser();
  }

  #enableRememberUser() {
    this.staticElements.rememberUser.classList.remove(`slider-button_active`);
    this.staticElements.rememberUser.dataset.rememberUser = true;
  }

  #disableRememberUser() {
    this.staticElements.rememberUser.classList.add(`slider-button_active`);
    this.staticElements.rememberUser.dataset.rememberUser = false;
  }

  #showLoginError(error) {
    this.staticElements.error.classList.add(`login__message_error`);
    this.staticElements.error.dataset.error = true;
    this.staticElements.error.textContent = error;

    this.messageTimeout.loginErrorResponse = setTimeout(
      this.#clearLoginError.bind(this),
      5000,
    );
  }

  #clearLoginError() {
    this.staticElements.error.classList.remove(`login__message_error`);
    this.staticElements.error.dataset.error = false;
    this.staticElements.error.textContent = ``;

    if (this.messageTimeout.loginErrorResponse) {
      clearTimeout(this.messageTimeout.loginErrorResponse);
    }
  }

  clearDataPanel() {
    this.staticElements.email.input.value = ``;
    this.staticElements.password.input.value = ``;

    this.#clearEmailError();
    this.#clearPasswordError();
    this.#clearLoginError();
    this.#enableRememberUser();

    this.staticElements.email.input.dataset.currectData = false;
    this.staticElements.password.input.dataset.currectData = false;
  }

  #addAwaitingConfirmButton(action) {
    const currentButtonElement = this.staticElements.buttons[action];

    if (!currentButtonElement) {
      console.log(`empty element`);
      return;
    }

    this.#disableConfirmButton(action);
    currentButtonElement.classList.add(`gradient-background_awaiting-response`);
  }

  #removeAwaitingConfirmButton(action) {
    const currentButtonElement = this.staticElements.buttons[action];

    if (!currentButtonElement) {
      console.log(`empty element`);
      return;
    }

    if (
      this.staticElements.email.input.dataset.currectData === `true` &&
      this.staticElements.password.input.dataset.currectData === `true`
    ) {
      this.#enableConfirmButton(action);
    }

    currentButtonElement.classList.remove(
      `gradient-background_awaiting-response`,
    );
  }

  #enableConfirmButton(action) {
    const currentButtonElement = this.staticElements.buttons[action];

    if (!currentButtonElement) {
      console.log(`empty element`);
      return;
    }

    currentButtonElement.dataset.activeButton = true;
    currentButtonElement.classList.remove(`button_inactive`);
  }

  #disableConfirmButton(action) {
    const currentButtonElement = this.staticElements.buttons[action];

    if (!currentButtonElement) {
      console.log(`empty element`);
      return;
    }

    currentButtonElement.dataset.activeButton = false;
    currentButtonElement.classList.add(`button_inactive`);
  }

  #chekingPassword(passwordElement) {
    const password = passwordElement.value.trim();
    const action = this.staticElements.body.dataset.action;

    this.#disableConfirmButton(action);
    this.staticElements.password.input.dataset.currectData = false;

    if (password.length < 5 || password.length > 24) {
      this.#showPasswordError(`Пароль должен быть от 5 до 24 символов`);
      return;
    }

    if (action === `register`) {
      if (!validatePassword(password)) {
        this.#showPasswordError(
          `В пароле должна быть минимум одна цифра, заглавная буква и специальный символ`,
        );
        return;
      }
    }

    this.#clearPasswordError();
    this.staticElements.password.input.dataset.currectData = true;

    if (this.staticElements.email.input.dataset.currectData === `true`) {
      this.#enableConfirmButton(action);
    }
  }

  #onKeyEnter() {
    const targetAction = this.staticElements.body.dataset.action;
    const targetBtn = this.staticElements.buttons[targetAction];

    if (targetBtn) {
      targetBtn.click();
    }
  }

  async #chekingEmail(emailElement) {
    const action = this.staticElements.body.dataset.action;
    const email = emailElement.value.trim();

    this.#clearEmailError();
    this.#clearLoginError();
    this.#disableConfirmButton(action);
    this.staticElements.email.input.dataset.currectData = false;

    if (email.length < 5) {
      this.#showEmailError(`Некорректный email`);
      return;
    }

    if (!validateEmail(email)) {
      this.#showEmailError(`Некорректный email`);
      return;
    }

    if (action === `register`) {
      this.#showEmailMessage(`Проверка email...`);

      const isAvailableEmail = await this.#chekingAvailableEmail(email, action);

      if (!isAvailableEmail.success) {
        if (!isAvailableEmail.aborted) {
          const errorMessage =
            isAvailableEmail.error === `Email already use`
              ? `Почта уже используется`
              : `Что-то пошло не так, попробуйте ввести email снова`;

          this.#showEmailError(errorMessage);
        }
        return;
      }

      this.#clearEmailMessage();
    }

    this.staticElements.email.input.dataset.currectData = true;

    if (this.staticElements.password.input.dataset.currectData === `true`) {
      this.#enableConfirmButton(action);
    }
  }

  async #chekingAvailableEmail(email) {
    const response = {
      success: false,
      aborted: false,
      error: null,
    };

    try {
      if (this.abortControllers.validateEmail) {
        this.abortControllers.validateEmail.abort();
        this.abortControllers.validateEmail = null;
      }

      this.abortControllers.validateEmail = new AbortController();

      const requestUrl = `${this.server}${this.paths.chekEmail}`;
      const requestBody = JSON.stringify({
        email: email,
      });
      const requestOptions = {
        headers: this.headers,
        method: `POST`,
        body: requestBody,
        signal: this.abortControllers.validateEmail.signal,
      };

      const responseFromServerJSON = await fetch(requestUrl, requestOptions);

      this.abortControllers.validateEmail = null;

      if (!responseFromServerJSON.ok) {
        throw `Сервер ответил с ошибкой`;
      }

      const responseFromServer = await responseFromServerJSON.json();

      if (!responseFromServer.success) {
        response.error = responseFromServer.error;
      }

      if (responseFromServer.success) {
        response.success = true;
      }

      return response;
    } catch (err) {
      if (err.name === 'AbortError') {
        response.aborted = true;
      } else {
        console.log(`Сервер недоступен: ${err}`);
        response.error = `Server error`;
      }

      return response;
    }
  }

  async authenticationByToken(data) {
    if (!data.refreshToken) {
      this.addDataToStream(`errorLoginUser`, {
        success: false,
        error: `Incorrect data`,
      });

      return;
    }

    const requestBody = {
      refreshToken: data.refreshToken,
      rememberUser: data.rememberUser,
      type: `token`,
    };

    const responseAuthentication =
      await this.#requestAuthentication(requestBody);

    responseAuthentication.success
      ? this.addDataToStream(`successLoginUser`, responseAuthentication)
      : this.addDataToStream(`errorLoginUser`, responseAuthentication);
  }

  async #authenticationByPassword() {
    if (
      this.staticElements.email.input.currectData === `false` ||
      this.staticElements.password.input.currectData === `false`
    ) {
      this.addDataToStream(`errorLoginUser`, {
        success: false,
        error: `Incorrect data`,
      });

      return;
    }

    const email = this.staticElements.email.input.value.trim();
    const password = this.staticElements.password.input.value.trim();
    const rememberUser =
      this.staticElements.rememberUser.dataset.rememberUser === `true`
        ? true
        : false;

    this.#clearLoginError();
    this.#addAwaitingConfirmButton(`login`);

    const requestBody = {
      email,
      password,
      rememberUser,
      type: `password`,
    };

    const responseAuthentication =
      await this.#requestAuthentication(requestBody);

    this.#removeAwaitingConfirmButton(`login`);

    if (responseAuthentication.success) {
      this.addDataToStream(`successLoginUser`, responseAuthentication);
      this.removeElementFromPage();
      return;
    }

    let errorMessage;
    switch (responseAuthentication.error) {
      case `Server error`:
        errorMessage = `Сервер временно недоступен, скоро все починим`;
        break;

      case `Authentication error`:
        errorMessage = `Указана неверная почта или пароль`;
        break;

      case `Unknown error`:
        errorMessage = `Что-то пошло не тиак, попробуйте снова`;
        break;
    }

    this.#showLoginError(errorMessage);
    this.addDataToStream(`errorLoginUser`, responseAuthentication);
  }

  async #requestAuthentication(body) {
    const responseAuthentication = {
      success: false,
      error: false,
      tokens: null,
      user: null,
      type: body.type,
    };

    try {
      if (!this.#fingerPrint) {
        await this.#getFingerPrint();
      }
      body.fingerPrint = this.#fingerPrint;

      const requestUrl = `${this.server}${this.paths.login}`;
      const requestBodyJSON = JSON.stringify(body);
      const requestOptions = {
        headers: this.headers,
        method: `POST`,
        body: requestBodyJSON,
      };

      const responseFromServerJSON = await fetch(requestUrl, requestOptions);

      if (!responseFromServerJSON.ok) {
        responseAuthentication.error = `Server error`;

        return responseAuthentication;
      }

      const responseFromServer = await responseFromServerJSON.json();

      if (
        !responseFromServer.success ||
        !responseFromServer.tokens ||
        !responseFromServer.user
      ) {
        responseAuthentication.error = `Authentication error`;

        return responseAuthentication;
      }

      responseAuthentication.user = responseFromServer.user;
      responseAuthentication.tokens = responseFromServer.tokens;
      responseAuthentication.success = true;

      return responseAuthentication;
    } catch (err) {
      console.log(`Fail request authorization: ${err}`);
      responseAuthentication.error = `Unknown error`;

      return responseAuthentication;
    }
  }

  async #registerUser() {
    if (
      this.staticElements.email.input.currectData === `false` &&
      this.staticElements.password.input.currectData === `false`
    ) {
      return;
    }

    this.#clearLoginError();
    this.#addAwaitingConfirmButton(`register`);

    const email = this.staticElements.email.input.value.trim();
    const password = this.staticElements.password.input.value.trim();
    const rememberUser =
      this.staticElements.rememberUser.dataset.rememberUser === `true`
        ? true
        : false;

    try {
      const requestUrl = `${this.server}${this.paths.register}`;
      const requestBody = JSON.stringify({
        email,
        password,
        rememberUser,
        fingerPrint: this.#fingerPrint,
      });

      const requestOptions = {
        headers: this.headers,
        method: `POST`,
        body: requestBody,
      };

      const responseFromServerJSON = await fetch(requestUrl, requestOptions);

      if (!responseFromServerJSON.ok) {
        throw `Сервер ответил с ошибкой`;
      }

      const responseFromServer = await responseFromServerJSON.json();

      if (!responseFromServer.success) {
        let errorMessage;
        switch (responseFromServer.error) {
          case `Email already use`:
            errorMessage = `Почта уже используется`;
            break;

          case `Server error`:
            errorMessage = `Сервер временно недоступен`;
            break;

          case `Incorrect data`:
            errorMessage = `Некорректная почта или пароль`;
            break;

          default:
            errorMessage = `Что-то пошло не так, попробуйте еще раз`;
        }
        this.#showLoginError(errorMessage);

        return;
      }

      const registerData = {
        user: responseFromServer.user,
        tokens: responseFromServer.tokens,
        rememberUser: responseFromServer.rememberUser,
      };

      this.addDataToStream(`successRegisterUser`, registerData);
      this.removeElementFromPage();
    } catch (err) {
      this.#showLoginError(`Сервер временно недоступен, скоро все починим`);
      console.log(`Сервер недоступен: ${err}`);
    } finally {
      this.#removeAwaitingConfirmButton(`register`);
    }
  }

  async logoutUser(tokens) {
    try {
      const requestUrl = `${this.server}${this.paths.logout}`;
      const requestBody = JSON.stringify({
        refreshToken: tokens.refresh,
        fingerPrint: this.#fingerPrint,
      });

      const requestOptions = {
        headers: {
          ...this.headers,
          Authorization: `Bearer ${tokens.access}`,
        },
        method: `POST`,
        body: requestBody,
      };

      const responseFromServerJSON = await fetch(requestUrl, requestOptions);

      if (!responseFromServerJSON.ok) {
        throw `Server error`;
      }

      const responseFromServer = await responseFromServerJSON.json();

      if (responseFromServer.success) {
        this.addDataToStream(`successLogoutUser`, `logout`);
        return;
      }

      this.addDataToStream(`errorLogoutUser`, responseFromServer.error);
    } catch (err) {
      this.addDataToStream(`errorLogoutUser`, err);
    }
  }
}
