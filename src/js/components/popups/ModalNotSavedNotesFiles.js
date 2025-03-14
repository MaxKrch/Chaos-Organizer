import Modal from './Modal';

export default class ModalNotSavedNotesFiles extends Modal {
  constructor(subscriber, messages) {
    super(null, subscriber);
    this.staticElements = {
      title: null,
      description: null,
      buttons: {
        container: null,
        close: null,
      },
    };

    this.#initElement(messages);
  }

  #initElement(messages) {
    this.#renderElement(messages);
    this.#createStreams();
    this.#subscribeToStreams();
    this.addElementToPage();
  }

  #renderElement(messages) {
    this.element = document.createElement(`aside`);
    this.element.classList.add(`modal__overlay`, `files-upload-error`);

    this.body = document.createElement(`article`);
    this.body.classList.add(`modal__body`, `files-upload-error__container`);
    this.body.dataset.id = `modalUploadFilesErrorBody`;

    this.#renderTitleElement();
    this.#renderDescriptionElement(messages);
    this.#renderCloseElement();

    this.body.append(
      this.staticElements.title,
      this.staticElements.description,
      this.staticElements.buttons.container,
    );

    this.element.append(this.body);
  }

  #renderTitleElement() {
    this.staticElements.title = document.createElement(`div`);
    this.staticElements.title.classList.add(
      `modal__title`,
      `flles-upload-error__section`,
      `flles-upload-error__title`,
    );
    this.staticElements.title.textContent = `Часть файлов не сохранились на сервере`;
  }

  #renderDescriptionElement(messages) {
    this.staticElements.description = document.createElement(`ul`);
    this.staticElements.description.classList.add(
      `modal__description`,
      `flles-upload-error__section`,
      `flles-upload-error__description`,
    );

    const messagesElements = [];
    messages.forEach((messageItem) => {
      const messageElement = document.createElement(`li`);
      messageElement.classList.add(`flles-upload-error__description-item`);
      messageElement.textContent = messageItem;

      messagesElements.push(messageElement);
    });

    this.staticElements.description.append(...messagesElements);
  }

  #renderCloseElement() {
    this.staticElements.buttons.container = document.createElement(`div`);
    this.staticElements.buttons.container.classList.add(
      `modal__buttons`,
      `flles-upload-error__section`,
      `flles-upload-error__buttons`,
    );

    this.staticElements.buttons.close = document.createElement(`button`);
    this.staticElements.buttons.close.classList.add(
      `button`,
      `flles-upload-error__button`,
    );
    this.staticElements.buttons.close.dataset.targetAction = `closeUploadFilesError`;
    this.staticElements.buttons.close.textContent = `Ок`;

    this.staticElements.buttons.container.append(
      this.staticElements.buttons.close,
    );
  }

  #createStreams() {}

  #subscribeToStreams() {}
}
