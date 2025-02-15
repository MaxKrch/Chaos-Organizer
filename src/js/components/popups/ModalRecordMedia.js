import Modal from './Modal';

export default class ModalRecordMedia extends Modal {
	constructor(subscriber, data) {
		super(null, subscriber);
		this.staticElements = {
			title: null,
			description: null,
			media: {
				container: null,
				file: null,
			},
			buttons: {
				container: null,
				close: null,
				download: null,
				remove: null,
			}
		}

		this.file = data.file ? 
			data.file :
			null;

		this.#initElement(data)
	}

	#initElement(data) {
		this.#renderElement(data);
		this.#createStreams();
		this.#subscribeToStreams();
		this.addElementToPage();
	}

	#renderElement(data) {
		this.element = document.createElement(`aside`);
		this.element.classList.add(`modal__overlay`, `stream-media-upload-error`);
		
		this.body = document.createElement(`article`);
		this.body.classList.add(`modal__body`, `stream-media-upload-error__container`);

		switch(data.type) {
			case `errorRecord`:
				this.body.dataset.id = `modalRecordMediaErrorBody`;
				break;

			case `cantSaveMedia`:
				this.body.dataset.id = `modalRecordMediaCantSaveBody`;
				break;
		}
		
		this.#renderTitleElement(data);		
		this.#renderDescriptionElement(data);

		this.body.append(
			this.staticElements.title,
			this.staticElements.description
		)

		if(data.type === `cantSaveMedia`) {
			this.#renderMediaBlock(data);
			this.body.append(this.staticElements.media.container);
		}

		this.#renderButtonsBlock(data)
		this.body.append(this.staticElements.buttons.container);

		this.element.append(this.body);
	}

	#renderTitleElement(data) {
		this.staticElements.title = document.createElement(`div`);
		this.staticElements.title.classList.add(`modal__title`, `stream-media-upload-error__section`, `stream-media-upload-error__title`);

		switch(data.error) {
			case `exceededLimit`:
				this.staticElements.title.textContent = `К записи добавлено слишком много файлов`;
				break;

			case `bigSize`:
				this.staticElements.title.textContent = `Слишком большой размер файла`;
				break;

			case `NotAllowedError`:
				this.staticElements.title.textContent = `Нет доступа к микрофону или камере`
				break;

			default:
				this.staticElements.title.textContent = `Приложение не смогло начать запись`
		}
	}

	#renderDescriptionElement(data) {
		this.staticElements.description = document.createElement(`div`);
		this.staticElements.description.classList.add(`modal__description`, `stream-media-upload-error__section`, `stream-media-upload-error__description`);

		switch(data.error) {
			case `exceededLimit`:
				this.staticElements.description.textContent = `Хотите скачать файл или удалить его навсегда?`;
				break;

			case `bigSize`:
				this.staticElements.description.textContent = `Хотите скачать файл или удалить его навсегда?`;
				break;
			
			case `NotAllowedError`:
				this.staticElements.description.textContent = `Разрешите доступ в настройках сайта, чтобы сделать запись`
				break;
			
			default:
				this.staticElements.description.textContent = `Попробуйте обновить страницу или сменить браузер`
		}
	}

	#renderMediaBlock(data) {
		this.staticElements.media.container = document.createElement(`div`);
		this.staticElements.media.container.classList.add(`stream-media-upload-error__section`, `stream-media-upload-error__video`);

		switch (this.file.type) {
			case `video`:
				this.staticElements.media.file = document.createElement(`video`);
				break;

			case `audio`: 
				this.staticElements.media.file = document.createElement(`audio`);
				break;
		}

		this.staticElements.media.file.classList.add(`stream-media-upload-error__video-file`);
		this.staticElements.media.file.setAttribute(`controls`, `controls`);
		this.staticElements.media.file.setAttribute(`src`, this.file.blobUrl)
		this.staticElements.media.container.append(this.staticElements.media.file);
	}

	#renderButtonsBlock(data) {
		this.staticElements.buttons.container = document.createElement(`div`);
		this.staticElements.buttons.container.classList.add(`modal__buttons`, `stream-media-upload-error__section`, `stream-media-upload-error__buttons`);

		if(data.type === `errorRecord`) {
			this.staticElements.buttons.close = document.createElement(`button`);
			this.staticElements.buttons.close.classList.add(`button`, `stream-media-upload-error__button`);
			this.staticElements.buttons.close.dataset.targetAction = `closeModalRecordMedia`;
			this.staticElements.buttons.close.textContent = `Ок`;

			this.staticElements.buttons.container.append(
				this.staticElements.buttons.close
			);
		}

		if(data.type === `cantSaveMedia`) {
			this.staticElements.buttons.remove = document.createElement(`button`);
			this.staticElements.buttons.remove.classList.add(`button`, `stream-media-upload-error__button`);
			this.staticElements.buttons.remove.dataset.targetAction = `removeRecordedMedia`;
			this.staticElements.buttons.remove.textContent = `Удалить`;
				
			this.staticElements.buttons.download = document.createElement(`button`);
			this.staticElements.buttons.download.classList.add(`button`, `stream-media-upload-error__button`);
			this.staticElements.buttons.download.dataset.targetAction = `downloadRecordedMedia`;
			this.staticElements.buttons.download.dataset.fileUrl = this.file.blobUrl;
			this.staticElements.buttons.download.dataset.fileName = this.file.file.name;
			this.staticElements.buttons.download.textContent = `Скачать`;

			this.staticElements.buttons.container.append(
				this.staticElements.buttons.remove,
				this.staticElements.buttons.download
			);
		}
	}

	#createStreams() {}

	#subscribeToStreams(callback) {}

	deleteElement() {
		if(this.file?.blobUrl) {
			console.log(this.file.blobUrl)
			URL.revokeObjectURL(this.file.blobUrl)
		}
		super.deleteElement();
	}
}





