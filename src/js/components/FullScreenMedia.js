import BaseComponent from '../helpers/BaseComponent';
import ContextMenu from './popups/ContextMenu';
import Modal from './popups/Modal';
import { Subject, fromEvent, throttleTime, debounceTime } from 'rxjs';
import { routes } from '../consts/index.js';
import downloadFile from '../helpers/downloadFile';

export default class FullscreenMedia extends BaseComponent {
  constructor(container, data, subscriber) {
    super(container);
    this.server = data.savedOnServer ? routes.server : '';

    this.staticElements = {
      media: {
        container: null,
        slides: null,
      },
      controller: {
        container: null,
        play: null,
        pause: null,
      },
      header: {
        container: null,
        title: null,
        menu: {
          container: null,
          remove: null,
          download: null,
          close: null,
        },
      },
      navigation: {
        left: null,
        right: null,
      },
    };
    this.source = null;
    this.files = {
      scope: null,
      active: null,
    };
    this.index = {
      current: null,
      max: null,
    };
    this.id = {
      note: null,
      file: null,
    };
    this.visibleNavigation = false;
    this.awaitingPlay = null;
    this.awaitingDownload = null;
    this.contextMenu = null;
    this.modal = null;

    this.#initComponent(data, subscriber);
  }

  #initComponent(data, subscriber) {
    this.#parsingAndSetData(data);
    this.#renderElement();
    this.#createStreams();
    this.#subscribeToStreams(subscriber);

    this.addElementToPage();
  }

  #parsingAndSetData(data) {
    this.source = data.source;
    this.id.file = data.idFile;

    if (data.source === `fileNote`) {
      this.files.active = data.media;
    }

    if (data.source === `noteAttachment`) {
      this.id.note = data.idNote;
      this.files.scope = data.media;
      this.index.max = this.files.scope.length - 1;
      this.index.current = this.files.scope.findIndex(
        (media) => media.id === this.id.file,
      );
      this.files.active = this.files.scope[this.index.current];
    }
  }

  #renderElement() {
    this.element = document.createElement(`aside`);
    this.element.classList.add(`modal__overlay`, `fullscreen-media`);
    this.element.dataset.id = 'fullscreenMedia';

    this.#renderMediaBlock();
    this.#renderHeaderBlock();
    this.#renderControllerBlock();
    this.element.append(
      this.staticElements.media.container,
      this.staticElements.header.container,
      this.staticElements.controller.container,
    );

    if (this.source === `noteAttachment`) {
      this.#renderScrollBlock();
    }
  }

  #renderMediaBlock() {
    this.staticElements.media.container = document.createElement(`div`);
    this.staticElements.media.container.classList.add(
      `fullscreen-media__media-block`,
    );

    if (this.source === `fileNote`) {
      this.staticElements.media.slides = {
        slide: this.#createMediaFile(this.files.active),
      };
      this.staticElements.media.slides.classList.add(
        `fullscreen-media__media_active`,
      );
      this.staticElements.media.container.append(
        this.staticElements.media.slides[slide],
      );
    }

    if (this.source === `noteAttachment`) {
      this.staticElements.media.slides = {};
      const slides = [];

      this.files.scope.forEach((item, index) => {
        const slide = this.#createMediaFile(item);
        this.staticElements.media.slides[index] = slide;
        slides.push(slide);

        if (index === this.index.current) {
          this.staticElements.media.slides[index].classList.add(
            `fullscreen-media__media_active`,
          );
        }
      });

      this.staticElements.media.container.append(...slides);
    }
  }

  #renderHeaderBlock() {
    this.staticElements.header.container = document.createElement(`div`);
    this.staticElements.header.container.classList.add(
      `fullscreen-media__header`,
    );
    this.staticElements.header.container.dataset.id = `fullscreenMediaHeader`;

    this.staticElements.header.title = document.createElement(`div`);
    this.staticElements.header.title.classList.add(`fullscreen-media__title`);
    this.staticElements.header.title.dataset.id = `fullscreenMediaTitle`;
    this.staticElements.header.title.textContent = this.files.active.title;

    this.staticElements.header.menu.container = document.createElement(`ul`);
    this.staticElements.header.menu.container.classList.add(
      `fullscreen-media__menu`,
      `not-selected`,
    );
    this.staticElements.header.menu.container.dataset.id = `fullscreenMediaMenu`;

    this.staticElements.header.menu.remove = document.createElement(`li`);
    this.staticElements.header.menu.remove.classList.add(
      `fullscreen-media__menu-item`,
      `not-selected`,
    );
    this.staticElements.header.menu.remove.dataset.id = `fullscreenMenuRemove`;
    this.staticElements.header.menu.remove.textContent = `Удалить`;

    this.staticElements.header.menu.download = document.createElement(`li`);
    this.staticElements.header.menu.download.classList.add(
      `fullscreen-media__menu-item`,
      `not-selected`,
    );
    this.staticElements.header.menu.download.dataset.id = `fullscreenMenuDownload`;
    this.staticElements.header.menu.download.textContent = `Скачать`;

    this.staticElements.header.menu.close = document.createElement(`li`);
    this.staticElements.header.menu.close.classList.add(
      `fullscreen-media__menu-item`,
    );
    this.staticElements.header.menu.close.dataset.id = `fullscreenMenuClose`;
    this.staticElements.header.menu.close.textContent = `Закрыть`;

    this.staticElements.header.menu.container.append(
      this.staticElements.header.menu.remove,
      this.staticElements.header.menu.download,
      this.staticElements.header.menu.close,
    );

    this.staticElements.header.container.append(
      this.staticElements.header.title,
      this.staticElements.header.menu.container,
    );
  }

  #renderControllerBlock() {
    this.staticElements.controller.container = document.createElement(`div`);
    this.staticElements.controller.container.classList.add(
      `fullscreen-media__controller`,
    );
    if (this.files.active.type === `video`) {
      this.staticElements.controller.container.classList.add(
        `fullscreen-media__controller_show`,
      );
    }
    this.staticElements.controller.container.dataset.id = `fullscreenVideoController`;

    this.staticElements.controller.play = document.createElement(`div`);
    this.staticElements.controller.play.classList.add(
      `fullscreen-media__controller-item`,
      `fullscreen-media__controller-play`,
      `fullscreen-media__controller-item_active`,
    );
    this.staticElements.controller.play.dataset.id = `fullscreenVideoPlay`;

    this.staticElements.controller.pause = document.createElement(`div`);
    this.staticElements.controller.pause.classList.add(
      `fullscreen-media__controller-item`,
      `fullscreen-media__controller-pause`,
    );
    this.staticElements.controller.pause.dataset.id = `fullscreenVideoPause`;
    this.staticElements.controller.pause.innerHTML = `
			<p class="fullscreen-media__controller-pause-line"></p>
			<p class="fullscreen-media__controller-pause-line"></p>
		`;

    this.staticElements.controller.container.append(
      this.staticElements.controller.play,
      this.staticElements.controller.pause,
    );
  }

  #createMediaFile(file) {
    const mediaFileElement = document.createElement(`div`);
    mediaFileElement.classList.add(`fullscreen-media__media-container`);
    mediaFileElement.dataset.name = `fullscreenMediaContainer`;

    const mediaFileMainContainer = document.createElement(`div`);
    mediaFileMainContainer.classList.add(
      `fullscreen-media__media-block`,
      `fullscreen-media__media-main`,
    );

    const mediaFileBackContainer = document.createElement(`div`);
    mediaFileBackContainer.classList.add(
      `fullscreen-media__media-block`,
      `fullscreen-media__media-back`,
    );

    let mediaFileMainElement;
    let mediaFileBackElement;

    switch (file.type) {
      case `video`:
        mediaFileMainElement = this.#renderMainVideoElement(file);
        mediaFileBackElement = this.#renderBackVideoElement(file);
        mediaFileBackElement.srcObject = mediaFileMainElement.captureStream();

        mediaFileMainElement.addEventListener(`canplay`, (event) => {
          const blockVideoContainer = event.target.closest(
            `[data-name="fullscreenMediaContainer"]`,
          );
          const backVideoElement = blockVideoContainer.querySelector(
            `[data-name="fullscreenMediaBackVideo"]`,
          );

          backVideoElement.srcObject = event.target.captureStream();
        });

        break;

      case `image`:
        mediaFileMainElement = this.#renderImageElement(file);
        mediaFileBackElement = this.#renderImageElement(file);
        break;
    }

    mediaFileMainElement.dataset.file = file.id;
    mediaFileMainElement.dataset.name = `fullscreenMediaFile`;
    mediaFileMainElement.classList.add(`fullscreen-media__media-main-file`);

    mediaFileBackElement.classList.add(`fullscreen-media__media-back-file`);

    mediaFileMainContainer.append(mediaFileMainElement);
    mediaFileBackContainer.append(mediaFileBackElement);

    mediaFileElement.append(mediaFileMainContainer, mediaFileBackContainer);

    return mediaFileElement;
  }

  #renderMainVideoElement(file) {
    const mainVideo = document.createElement(`video`);
    mainVideo.classList.add(`fullscreen-media__media-file`);

    mainVideo.setAttribute(`src`, `${this.server}${file.src}`);
    mainVideo.setAttribute(`preload`, `metadata`);
    mainVideo.setAttribute(`crossOrigin`, `anonymous`);

    if (file.poster) {
      mainVideo.setAttribute(`poster`, `${routes.server}${file.poster}`);
    }

    return mainVideo;
  }

  #renderBackVideoElement(file) {
    const backVideo = document.createElement(`video`);
    backVideo.classList.add(`fullscreen-media__media-file`);

    backVideo.dataset.name = `fullscreenMediaBackVideo`;

    backVideo.setAttribute(`mute`, `mute`);
    backVideo.setAttribute(`autoplay`, `autoplay`);

    return backVideo;
  }

  #renderImageElement(file) {
    const imageElement = document.createElement(`img`);
    imageElement.classList.add(`fullscreen-media__media-file`);
    imageElement.dataset.name = `fullscreenMediaFile`;
    imageElement.setAttribute(`alt`, file.title);
    imageElement.setAttribute(`src`, `${this.server}${file.src}`);

    return imageElement;
  }

  #renderScrollBlock() {
    this.staticElements.navigation.left = document.createElement(`div`);
    this.staticElements.navigation.left.classList.add(
      `figure-button`,
      `fullscreen-media__arrow`,
      `fullscreen-media__arrow-left`,
    );
    this.staticElements.navigation.left.dataset.id = `fullscreenScrollLeft`;
    this.staticElements.navigation.left.innerHTML = `
			<div class="figure-button__item figure-button__arrow figure-button__arrow-left fullscreen-media__arrow-icon">
			</div>
		`;

    this.staticElements.navigation.right = document.createElement(`div`);
    this.staticElements.navigation.right.classList.add(
      `figure-button`,
      `fullscreen-media__arrow`,
      `fullscreen-media__arrow-right`,
    );
    this.staticElements.navigation.right.dataset.id = `fullscreenScrollRight`;
    this.staticElements.navigation.right.innerHTML = `
			<div class="figure-button__item figure-button__arrow figure-button__arrow-right fullscreen-media__arrow-icon">
			</div>
		`;
    this.element.append(
      this.staticElements.navigation.left,
      this.staticElements.navigation.right,
    );
  }

  #createStreams() {
    this.saveStream(`requestAction`, new Subject());

    const clicksOnElement = fromEvent(this.element, `click`).pipe(
      throttleTime(50),
    );
    this.saveStream(`clicksOnElement`, clicksOnElement);

    const mouseMove = fromEvent(this.element, `mousemove`).pipe(
      throttleTime(100),
    );
    this.saveStream(`mouseMove`, mouseMove);
  }

  #subscribeToStreams(subscriber) {
    this.subscribeToStream(`requestAction`, subscriber);

    this.subscribeToStream(`mouseMove`, this.#onMouseMove.bind(this));
    this.subscribeToStream(
      `clicksOnElement`,
      this.#onClickByElement.bind(this),
    );
  }

  async #scrollMedia(direction = `right`) {
    if (this.files.active.type === `video`) {
      await this.#pauseVideo();
    }

    let indexNewSlide;

    if (direction === `left`) {
      indexNewSlide =
        this.index.current > 0 ? this.index.current - 1 : this.index.max;
    }

    if (direction == `right`) {
      indexNewSlide =
        this.index.current < this.index.max ? this.index.current + 1 : 0;
    }

    const oldSlide = this.staticElements.media.slides[this.index.current];
    const newSlide = this.staticElements.media.slides[indexNewSlide];

    oldSlide.classList.remove(`fullscreen-media__media_active`);
    newSlide.classList.add(`fullscreen-media__media_active`);

    this.files.active = this.files.scope[indexNewSlide];
    this.staticElements.header.title.textContent = this.files.active.title;
    this.index.current = indexNewSlide;

    this.files.active.type === `video`
      ? this.#showVideoController()
      : this.#hideVideoController();
  }

  #showNavigation() {
    this.staticElements.header.container.classList.add(
      `fullscreen-media__header_show`,
    );
    if (this.files.scope && this.files.scope.length > 1) {
      this.staticElements.navigation.left.classList.add(
        `fullscreen-media__arrow-left_show`,
      );
      this.staticElements.navigation.right.classList.add(
        `fullscreen-media__arrow-right_show`,
      );
    }

    if (this.files.active.type === `video`) {
      this.#showVideoController();
    }

    this.visibleNavigation = true;
  }

  #showVideoController() {
    this.staticElements.controller.container.classList.add(
      `fullscreen-media__controller_show`,
    );
  }

  #hideVideoController() {
    this.staticElements.controller.container.classList.remove(
      `fullscreen-media__controller_show`,
    );
  }

  #showPlayButton() {
    this.staticElements.controller.play.classList.add(
      `fullscreen-media__controller-item_active`,
    );
  }

  #hidePlayButton() {
    this.staticElements.controller.play.classList.remove(
      `fullscreen-media__controller-item_active`,
    );
  }

  #showPauseButton() {
    this.staticElements.controller.pause.classList.add(
      `fullscreen-media__controller-item_active`,
    );
  }

  #hidePauseButton() {
    this.staticElements.controller.pause.classList.remove(
      `fullscreen-media__controller-item_active`,
    );
  }

  #hideNavigation() {
    this.staticElements.header.container.classList.remove(
      `fullscreen-media__header_show`,
    );
    this.staticElements.navigation.left.classList.remove(
      `fullscreen-media__arrow-left_show`,
    );
    this.staticElements.navigation.right.classList.remove(
      `fullscreen-media__arrow-right_show`,
    );
    this.visibleNavigation = false;

    if (this.files.active.type === `video`) {
      const videoElement = this.#getActiveMediaElement();

      if (!videoElement.paused && !this.awaitingPlay) {
        this.#hideVideoController();
      }
    }
  }

  #getActiveMediaElement() {
    const targetVideoElement =
      this.staticElements.media.slides[this.index.current];
    const mediaElement = targetVideoElement.querySelector(
      `[data-name="fullscreenMediaFile"]`,
    );

    return mediaElement;
  }

  #onMouseMove(event) {
    const positionX = event.clientX;
    const positionY = event.clientY;
    const clientWidth = document.documentElement.clientWidth;
    const clientHeight = document.documentElement.clientHeight;

    if (
      positionX < 50 ||
      positionY < 50 ||
      clientWidth - positionX < 50 ||
      clientHeight - positionY < 50
    ) {
      this.#showNavigation();
      return;
    }
  }

  #onClickByElement(event) {
    if (event.target.closest(`[data-id="fullscreenMediaMenu"]`)) {
      event.stopPropagation();
      this.#onClickTopMenu(event.target);
      return;
    }

    if (event.target.closest(`[data-id="fullscreenScrollLeft"]`)) {
      this.#scrollMedia(`left`);
      return;
    }

    if (event.target.closest(`[data-id="fullscreenScrollRight"]`)) {
      this.#scrollMedia(`right`);
      return;
    }

    if (event.target.closest(`[data-id="fullscreenVideoController"]`)) {
      this.#switchPlayedVideo();
      return;
    }

    if (event.target.closest(`[data-id="fullscreenMediaTitle"]`)) {
      return;
    }

    this.#switchVisibleNavigation();
  }

  #switchPlayedVideo() {
    const videoElement = this.#getActiveMediaElement();

    videoElement.paused ? this.#playVideo() : this.#pauseVideo();
  }

  async #playVideo() {
    if (this.files.active.type !== `video`) {
      return;
    }
    this.#addAwaitingPlayed();

    const videoElement = this.#getActiveMediaElement();

    videoElement.onended = () => this.#onPauseVideo();
    videoElement.onpause = () => this.#onPauseVideo();

    videoElement
      .play()
      .then(() => this.#onPlayVideo())
      .catch((err) => {
        console.log(`Не удалось запустить видео: ${err}`);
        this.#removeAwaitingPlayed();
      });
  }

  async #pauseVideo() {
    if (this.files.active.type !== `video`) {
      return;
    }

    const videoElement = this.#getActiveMediaElement();

    if (this.awaitingPlay || videoElement.paused) {
      return;
    }

    this.#showPlayButton();
    this.#hidePauseButton();

    await videoElement.pause();
  }

  #onPauseVideo() {
    if (this.files.active.type !== `video`) {
      return;
    }

    this.#showPlayButton();
    this.#hidePauseButton();
    this.#showNavigation();
    this.#showVideoController();
  }

  #onPlayVideo() {
    if (this.files.active.type !== `video`) {
      return;
    }

    this.#showPauseButton();
    this.#hidePlayButton();

    this.#hideVideoController();
    this.#hideNavigation();

    this.#removeAwaitingPlayed();
  }

  #switchVisibleNavigation() {
    this.visibleNavigation === true
      ? this.#hideNavigation()
      : this.#showNavigation();
  }

  async #onClickTopMenu(target) {
    switch (target.dataset.id) {
      case `fullscreenMenuDownload`:
        if (this.awaitingDownload) {
          return;
        }

        this.#addAwaitingDownload();
        await this.#downloadFile();
        this.#removeAwaitingDownload();
        this.#hideNavigation();
        break;

      case `fullscreenMenuClose`:
        this.addDataToStream(`requestAction`, {
          action: `close`,
        });
        break;

      case `fullscreenMenuRemove`:
        this.#showModalRemoveFile();
        this.#hideNavigation();
        break;
    }
  }

  async #downloadFile() {
    const fullUrl = `${this.server}${this.files.active.src}`;
    await downloadFile(fullUrl, this.files.active.title);
  }

  #addAwaitingPlayed() {
    this.awaitingPlay = true;
    this.staticElements.controller.container.classList.add(
      `gradient-background_awaiting-response`,
    );
  }

  #removeAwaitingPlayed() {
    this.awaitingPlay = false;
    this.staticElements.controller.container.classList.remove(
      `gradient-background_awaiting-response`,
    );
  }

  #addAwaitingDownload() {
    this.awaitingDownload = true;
    this.staticElements.header.menu.download.classList.add(
      `gradient-background_awaiting-response`,
    );
  }

  #removeAwaitingDownload() {
    this.awaitingDownload = false;
    this.staticElements.header.menu.download.classList.remove(
      `gradient-background_awaiting-response`,
    );
  }

  #showModalRemoveFile(event) {
    if (this.modal) {
      this.modal.deleteElement();
      this.modal = null;
    }

    const modalElement = this.#createModalRemoveFile();
    this.modal = new Modal(
      modalElement,
      this.#onClickModalRemoveFile.bind(this),
    );
    this.modal.addElementToPage();
  }

  #createModalRemoveFile() {
    const modalElement = document.createElement(`aside`);
    modalElement.classList.add(`modal__overlay`, `remove-file`);
    modalElement.dataset.note = this.id.file;
    modalElement.dataset.id = `modalRemoveFile`;

    modalElement.innerHTML = `
			<div class="modal__body remove-file__container" data-id="modalRemoveFileBody">
				<h2 class="modal__title remove-file__section remove-note__title">
					Хотите навсегда удалить этот файл?
				</h2>
						
				<div class="remove-file__section remove-note__file-title">
					${this.files.active.title}		
				</div>

				<div class="modal__buttons remove-file__section remove-note__buttons">
					<button class="button remove-note__button" data-id="fileRemoveConfirm">
						Удалить
					</button>

					<button class="button remove-note__button" data-id="fileRemoveCancel">
						Отмена
					</button>
				</div>
			</div>
		`;
    return modalElement;
  }

  #onClickModalRemoveFile(event) {
    if (!event.target.closest(`[data-id="modalRemoveFileBody"]`)) {
      this.#removeModalRemoveFile();
    }

    switch (event.target.dataset.id) {
      case `fileRemoveCancel`:
        this.#removeModalRemoveFile();
        break;

      case `fileRemoveConfirm`:
        const fileData = {
          ...this.id,
          type: this.files.active.type,
        };
        this.addDataToStream(`requestAction`, {
          action: `remove`,
          data: fileData,
        });
        this.#removeModalRemoveFile();
        break;
    }
  }

  #removeModalRemoveFile() {
    this.modal.deleteElement();
    this.modal = null;
  }
}
