import Modal from './Modal';
import { debounceTime, fromEvent } from 'rxjs';
import { routes } from '../../consts/index.js';

export default class ModalSidebarChangeTag extends Modal {
  constructor(subscriber, tag, onInputTagValue) {
    super(null, subscriber);
    this.tag = tag;
    this.staticElements = {
      body: null,
      title: null,
      tag: null,
      buttons: {
        container: null,
        close: null,
        confirm: null,
      },
    };

    this.onInputTagValue =
      this.tag.action === `change` ? onInputTagValue : null;

    this.#initElement();
  }

  #initElement() {
    this.#renderElement();
    this.#createStreams();
    this.#subscribeToStreams();
    this.addElementToPage();

    if (this.tag.action === `change`) {
      this.staticElements.tag.focus();
      this.staticElements.tag.setSelectionRange(
        this.staticElements.tag.value.length,
        this.staticElements.tag.value.length,
      );
    }
  }

  #renderElement() {
    this.element = document.createElement(`aside`);
    this.element.classList.add(`modal__overlay`, `sidebar-modal`);

    this.staticElements.body = document.createElement(`article`);
    this.staticElements.body.classList.add(
      `modal__body`,
      `sidebar-modal__body`,
    );
    this.staticElements.body.dataset.id = `modalBody`;

    this.staticElements.title = document.createElement(`h2`);
    this.staticElements.title.classList.add(
      `modal__title`,
      `sidebar-modal__title`,
    );
    this.staticElements.title.textContent =
      this.tag.action === `delete` ? `Удалить тег?` : `Изменить тег?`;

    this.tag.action === `delete`
      ? this.#renderDeleteTagBody()
      : this.#renderChangeTagBody();

    this.staticElements.buttons.container = document.createElement(`div`);
    this.staticElements.buttons.container.classList.add(
      `modal__buttons`,
      `sidebar-modal__buttons`,
    );

    this.staticElements.buttons.cancel = document.createElement(`button`);
    this.staticElements.buttons.cancel.classList.add(
      `button`,
      `sidebar-modal__button`,
    );
    this.staticElements.buttons.cancel.dataset.name = `sidebarModalTagButton`;
    this.staticElements.buttons.cancel.dataset.id = `sidebarModalTagCancel`;
    this.staticElements.buttons.cancel.textContent = `Отмена`;

    this.staticElements.buttons.confirm = document.createElement(`button`);
    this.staticElements.buttons.confirm.classList.add(
      `button`,
      `sidebar-modal__button`,
      `sidebar-modal__remove`,
    );

    if (this.tag.action === `change`) {
      this.staticElements.buttons.confirm.classList.add(
        `sidebar-modal__button_inactive`,
      );
      this.staticElements.buttons.confirm.dataset.active = `false`;
    }

    this.staticElements.buttons.confirm.dataset.name = `sidebarModalTagButton`;
    this.staticElements.buttons.confirm.dataset.id =
      this.tag.action === `delete`
        ? `sidebarModalTagDelete`
        : `sidebarModalTagChange`;

    this.staticElements.buttons.confirm.textContent =
      this.tag.action === `delete` ? `Удалить` : `Сохранить`;

    this.staticElements.buttons.container.append(
      this.staticElements.buttons.cancel,
      this.staticElements.buttons.confirm,
    );

    this.staticElements.body.append(
      this.staticElements.title,
      this.staticElements.tag,
      this.staticElements.buttons.container,
    );

    this.element.append(this.staticElements.body);
  }

  #renderDeleteTagBody() {
    this.staticElements.tag = document.createElement(`div`);
    this.staticElements.tag.classList.add(`sidebar-modal__description`);
    this.staticElements.tag.textContent = this.tag.title;
  }

  #renderChangeTagBody() {
    this.staticElements.tag = document.createElement(`input`);
    this.staticElements.tag.classList.add(
      `modal__input`,
      `sidebar-modal__input`,
    );
    this.staticElements.tag.setAttribute(`type`, `text`);
    this.staticElements.tag.setAttribute(`value`, this.tag.title);
    this.staticElements.tag.dataset.id = `sidebarModalInput`;
    this.staticElements.tag.dataset.tagId = this.tag.id;
    this.staticElements.tag.dataset.tagTitle = this.tag.title;
  }

  #createStreams() {
    if (this.tag.action === `change`) {
      const startInputTagTitle = fromEvent(this.staticElements.tag, `input`);
      this.saveStream(`startInputTagTitle`, startInputTagTitle);

      const endInputTagTitle = fromEvent(this.staticElements.tag, `input`).pipe(
        debounceTime(150),
      );
      this.saveStream(`endInputTagTitle`, endInputTagTitle);
    }
  }

  #subscribeToStreams() {
    if (this.tag.action === `change`) {
      this.subscribeToStream(
        `startInputTagTitle`,
        this.#disableModalTagChangeButton.bind(this),
      );
      this.subscribeToStream(`endInputTagTitle`, this.onInputTagValue);
    }
  }

  #enableModalTagChangeButton() {
    this.staticElements.buttons.confirm.dataset.active = true;
    this.staticElements.buttons.confirm.classList.remove(
      `sidebar-modal__button_inactive`,
    );
    this.staticElements.tag.classList.add(`input-value_good`);
    this.staticElements.tag.classList.remove(`input-value_bad`);
  }

  #disableModalTagChangeButton() {
    this.staticElements.buttons.confirm.dataset.active = false;
    this.staticElements.buttons.confirm.classList.add(
      `sidebar-modal__button_inactive`,
    );
    this.staticElements.tag.classList.add(`input-value_bad`);
    this.staticElements.tag.classList.remove(`input-value_good`);
  }

  #addAwaitingModalTagChangeButton() {
    this.staticElements.buttons.confirm.classList.add(
      `gradient-background_awaiting-response`,
    );
  }

  #removeAwaitingModalTagChangeButton() {
    this.staticElements.buttons.confirm.classList.remove(
      `gradient-background_awaiting-response`,
    );
  }

  async validateChangingTagTitle(token) {
    const tagTitle = this.staticElements.tag.value.trim();

    if (!tagTitle || tagTitle === this.tag.title) {
      return;
    }

    try {
      this.#addAwaitingModalTagChangeButton();

      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }

      this.abortController = new AbortController();

      const requestUrl = `${routes.server}${routes.serverPaths.validateTag}`;
      const requestHeadera = {
        'Content-Type': 'application/json;charset=utf-8',
        Authorization: `Bearer ${token}`,
      };

      const requestBody = JSON.stringify({
        tag: {
          id: this.tag.id,
          title: tagTitle,
        },
      });

      const requestOptions = {
        headers: requestHeadera,
        method: `POST`,
        body: requestBody,
        signal: this.abortController.signal,
      };

      const responseFromServerJSON = await fetch(requestUrl, requestOptions);

      this.abortController = null;

      if (!responseFromServerJSON.ok) {
        throw `Server error`;
      }

      const responseFromServer = await responseFromServerJSON.json();

      if (!responseFromServer.success) {
        throw responseFromServer.error;
      }

      if (!responseFromServer.available) {
        throw `Tag not available`;
      }

      this.#removeAwaitingModalTagChangeButton();
      this.#enableModalTagChangeButton();

      return true;
    } catch (err) {
      if (err.name === `AbortError`) return;
      console.log(err);
      this.#removeAwaitingModalTagChangeButton();

      return false;
    }
  }
}
