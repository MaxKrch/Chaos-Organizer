import Modal from './Modal';
import { fromEvent, debounceTime, filter } from 'rxjs';
import { validateCoords } from '../../helpers/validateAndFormatCoords.js';

export default class ModalGeolocation extends Modal {
  constructor(subscriber) {
    super(null, subscriber);
    this.staticElements = {
      title: null,
      coords: {
        container: null,
        description: null,
        input: null,
        error: null,
      },
      buttons: {
        container: null,
        cancel: null,
        confirm: null,
      },
    };

    this.#initElement();
  }

  #initElement() {
    this.#renderElement();
    this.#createStreams();
    this.#subscribeToStreams();
    this.addElementToPage();
  }

  #renderElement() {
    this.element = document.createElement(`aside`);
    this.element.classList.add(`modal__overlay`, `geolocation-confirm`);
    this.body = document.createElement(`div`);
    this.body.classList.add(`modal__body`, `geolocation-confirm__container`);
    this.body.dataset.id = `modalGeolocationBody`;

    this.#renderTitleElement();
    this.#renderCoordsElement();
    this.#renderButtonsElement();

    this.body.append(
      this.staticElements.title,
      this.staticElements.coords.container,
      this.staticElements.buttons.container,
    );

    this.element.append(this.body);
  }

  #createStreams() {
    const inputCoordsGeolocation = fromEvent(
      this.staticElements.coords.input,
      `input`,
    ).pipe(debounceTime(150));

    this.saveStream(`inputCoordsGeolocation`, inputCoordsGeolocation);

    const pressEnterGeolocation = fromEvent(
      this.staticElements.coords.input,
      `keypress`,
    ).pipe(
      filter((event) => {
        if (event.key === 'Enter' && event.shiftKey === false) {
          return true;
        }
      }),
    );
    this.saveStream(`pressEnterGeolocation`, pressEnterGeolocation);
  }

  #subscribeToStreams() {
    this.subscribeToStream(
      `inputCoordsGeolocation`,
      this.#onInputCoordsGeolocation.bind(this),
    );
    this.subscribeToStream(
      `pressEnterGeolocation`,
      this.#onPressEnterGeolocation.bind(this),
    );
  }

  #renderTitleElement() {
    this.staticElements.title = document.createElement(`h2`);
    this.staticElements.title.classList.add(
      `modal__title`,
      `geolocation-confirm__section`,
      `geolocation-confirm__title`,
    );
    this.staticElements.title.textContent = `
			Добавить вашу геолокацию к записи?
		`;
  }

  #renderCoordsElement() {
    this.staticElements.coords.container = document.createElement(`div`);
    this.staticElements.coords.container.classList.add(
      `geolocation-confirm__section`,
      `geolocation-confirm__coords`,
    );

    this.staticElements.coords.description = document.createElement(`div`);
    this.staticElements.coords.description.classList.add(
      `geolocation-confirm__coords-title`,
    );

    this.staticElements.coords.input = document.createElement(`input`);
    this.staticElements.coords.input.classList.add(
      `modal__input`,
      `geolocation-confirm__coords-input`,
    );
    this.staticElements.coords.input.dataset.id = `geolocationCoordsInput`;
    this.staticElements.coords.input.setAttribute(`type`, `text`);
    this.staticElements.coords.input.setAttribute(
      `placeholder`,
      `Например: -15.5005157, 2.5404780`,
    );

    this.staticElements.coords.error = document.createElement(`div`);
    this.staticElements.coords.error.classList.add(
      `geolocation-confirm__coords-error`,
    );

    this.staticElements.coords.container.append(
      this.staticElements.coords.description,
      this.staticElements.coords.input,
      this.staticElements.coords.error,
    );
  }

  #renderButtonsElement() {
    this.staticElements.buttons.container = document.createElement(`div`);
    this.staticElements.buttons.container.classList.add(
      `modal__buttons`,
      `geolocation-confirm__section`,
      `geolocation-confirm__buttons`,
    );

    this.staticElements.buttons.cancel = document.createElement(`button`);
    this.staticElements.buttons.cancel.classList.add(
      `button`,
      `geolocation-confirm__button`,
    );
    this.staticElements.buttons.cancel.dataset.id = `geolocationButtonCancel`;
    this.staticElements.buttons.cancel.dataset.targetAction = `closeModal`;
    this.staticElements.buttons.cancel.textContent = `Отмена`;

    this.staticElements.buttons.confirm = document.createElement(`button`);
    this.staticElements.buttons.confirm.classList.add(
      `button`,
      `button_inactive`,
      `geolocation-confirm__button`,
    );
    this.staticElements.buttons.confirm.dataset.id = `geolocationButtonConfirm`;
    this.staticElements.buttons.confirm.dataset.targetAction = `saveCoords`;
    this.staticElements.buttons.confirm.textContent = `Сохранить`;

    this.staticElements.buttons.container.append(
      this.staticElements.buttons.cancel,
      this.staticElements.buttons.confirm,
    );
  }

  setDescriptionConfirmGeolocation() {
    this.staticElements.coords.description.textContent = `
			Убедитесь, что координаты указаны верно, и нажмите "Сохранить"
		`;
  }

  setDescriptionInputGeolocation() {
    this.staticElements.coords.description.textContent = `
			Введите координаты или разрешите сайту определить вашу геолокацию
		`;
  }

  updateCoordsInput(coords) {
    this.coords = `${coords[0]} ${coords[1]}`;
    this.staticElements.coords.input.value = this.coords;
    this.#validateCoords();
  }

  setInitCoordsFromNavigator(coords) {
    if (this.staticElements.coords.input.value.trim() === ``) {
      this.updateCoordsInput(coords);
    }
  }

  showGeolocationError(
    error = `Запишите координаты в формате 0.0000000 0.0000000`,
  ) {
    this.staticElements.coords.error.classList.remove(`hidden-item`);
    this.staticElements.coords.error.textContent = error;
    this.staticElements.coords.input.classList.remove(`input-value_good`);
    this.staticElements.coords.input.classList.add(`input-value_bad`);
    this.staticElements.buttons.confirm.classList.add(`button_inactive`);
    this.staticElements.buttons.confirm.dataset.active = false;
  }

  hideGeolocationError() {
    this.staticElements.coords.error.classList.add(`hidden-item`);
    this.staticElements.coords.error.textContent = ``;
    this.staticElements.coords.input.classList.add(`input-value_good`);
    this.staticElements.coords.input.classList.remove(`input-value_bad`);
    this.staticElements.buttons.confirm.classList.remove(`button_inactive`);
    this.staticElements.buttons.confirm.dataset.active = true;
  }

  #onInputCoordsGeolocation() {
    this.coords = this.staticElements.coords.input.value.trim();

    if (this.coords.length < 3) {
      this.showGeolocationError();
      return;
    }

    this.#validateCoords();
  }

  #validateCoords() {
    validateCoords(this.coords)
      ? this.hideGeolocationError()
      : this.showGeolocationError();
  }

  #onPressEnterGeolocation() {
    this.staticElements.buttons.confirm.dispatchEvent(
      new MouseEvent(`click`, {
        bubbles: true,
      }),
    );
  }
}
