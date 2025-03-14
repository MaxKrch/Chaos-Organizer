import BaseComponent from '../../helpers/BaseComponent';
import ContextMenu from '../popups/ContextMenu';
import Modal from '../popups/Modal';
import PinnedNote from '../PinnedNote';
import NoteList from '../containers/NoteList';
import FeedScrollButton from '../FeedScrollButton';
import PreloadFeed from '../PreloadFeed';
import EditingNote from '../EditingNote';
import { routes } from '../../consts/index.js';
import downloadFile from '../../helpers/downloadFile';
import { Subject, fromEvent, throttleTime, debounceTime } from 'rxjs';

export default class FeedMain extends BaseComponent {
  constructor(container) {
    super(container);

    this.server = routes.server;

    this.pinnedNote = null;
    this.noteList = null;
    this.preloadFeed = null;
    this.editingNote = null;
    this.scrollButton = null;

    (this.location = {
      section: null,
      category: null,
    }),
      (this.awaitingDownload = null);

    this.modal = null;
    this.contextMenu = null;
  }

  initionRender() {
    this.#createElement();
    this.addElementToPage();

    this.scrollButton = new FeedScrollButton(this.element);
    this.scrollButton.addElementToPage();

    this.#createStreams();
    this.#subscribeToStreams();
  }

  #createElement() {
    this.element = document.createElement(`main`);
    this.element.classList.add(`feed-main`);
  }

  #createStreams() {
    this.saveStream(`unpinNote`, new Subject());
    this.saveStream(`getPinnedNote`, new Subject());

    this.saveStream(`pinNote`, new Subject());
    this.saveStream(`addNoteToFavorites`, new Subject());
    this.saveStream(`removeNoteFromFavorites`, new Subject());

    this.saveStream(`requestNotesByTag`, new Subject());
    this.saveStream(`requestSynchFeed`, new Subject());
    this.saveStream(`requestLiveLoading`, new Subject());

    this.saveStream(`showFullScreenMedia`, new Subject());

    this.saveStream(`requestEditingNote`, new Subject());
    this.saveStream(`saveEditedNote`, new Subject());
    this.saveStream(`removeNote`, new Subject());
    this.saveStream(`removeFile`, new Subject());

    const scrollFeed = fromEvent(this.element, `scroll`).pipe(debounceTime(50));
    this.saveStream(`scrollFeed`, scrollFeed);
  }

  #subscribeToStreams() {
    this.subscribeToStream(`scrollFeed`, this.#onScrollingFeed.bind(this));
    this.scrollButton.subscribeToStream(
      `scrollToDown`,
      this.scrollToDown.bind(this),
    );
  }

  renderPreloadFeed(type) {
    this.deletePreloadFeed();
    this.preloadFeed = new PreloadFeed(this.element, type);

    if (this.pinnedNote) {
      this.pinnedNote.removeElementFromPage();
    }

    if (this.noteList) {
      this.noteList.deleteElement();
    }

    if (this.editingNote) {
      this.editingNote.removeElementFromPage();
    }

    this.disableScrolling();
    this.preloadFeed.addElementToPage();
  }

  deletePreloadFeed() {
    this.enableScrolling();

    if (this.preloadFeed) {
      this.preloadFeed.deleteElement();
      this.preloadFeed = null;
    }
  }

  setActiveLocation(location) {
    if (!location) {
      return;
    }

    this.location = location;
  }

  removeNoteById(idNote) {
    const indexTargetNote = this.noteList.notes.findIndex(
      (note) => note.id === idNote,
    );

    if (indexTargetNote) {
      this.noteList.notes.splice(indexTargetNote, 1);
    }

    const targetNoteElement = this.noteList.element.querySelector(
      `[data-name="feedContentItem"][data-id="${idNote}"]`,
    );

    if (targetNoteElement) {
      targetNoteElement.remove();
    }
  }

  #addOverlayToFeed() {
    this.container.classList.add(`section-overlay`);
  }

  #removeOverlayFromFeed() {
    this.container.classList.remove(`section-overlay`);
  }

  renderPinnedNote(note) {
    if (this.pinnedNote) {
      this.pinnedNote.deleteElement();
    }

    if (!note) {
      return;
    }

    const serverPath = note.savedOnServer ? this.server : '';

    const noteData = {
      id: note.id,
      text: note.text,
    };

    if (note.attachment?.image[0]) {
      noteData.img = note.attachment.image[0];
    }

    this.pinnedNote = new PinnedNote(this.element, noteData, serverPath);

    if (!this.preloadFeed && this.pinnedNote) {
      if (
        this.location.section === `notes` ||
        this.location.section === `tag`
      ) {
        this.pinnedNote.addElementToPage();
      }
    }

    this.#createPinnedStreams();
    this.#subscribeToPinnedStreams();
  }

  deletePinnedNote() {
    if (this.pinnedNote) {
      this.pinnedNote.deleteElement();
    }
  }

  #createPinnedStreams() {
    const clicksOnPinnedNote = fromEvent(this.pinnedNote.element, `click`).pipe(
      throttleTime(350),
    );
    this.pinnedNote.saveStream(`clicksOnPinnedNote`, clicksOnPinnedNote);
  }

  #subscribeToPinnedStreams() {
    this.pinnedNote.subscribeToStream(
      `clicksOnPinnedNote`,
      this.#onClickOnPinnedNote.bind(this),
    );
  }

  renderNoteList(notes) {
    if (this.preloadFeed) {
      this.deletePreloadFeed();
    }

    if (this.pinnedNote) {
      if (
        this.location.section === `notes` &&
        this.location.category === `all`
      ) {
        this.pinnedNote.addElementToPage();
      } else {
        this.pinnedNote.removeElementFromPage();
      }
    }

    const topScroll = this.noteList ? this.element.scrollTop : null;

    if (this.noteList) {
      this.noteList.deleteElement();
    }

    if (this.contextMenu) {
      this.deleteContextMenu();
    }

    this.noteList = new NoteList(this.element, this.location, notes);

    if (this.noteList) {
      this.noteList.addElementToPage();

      const clicksOnNoteList = fromEvent(this.noteList.element, `click`).pipe(
        throttleTime(350),
      );
      this.noteList.saveStream(`clicksOnNoteList`, clicksOnNoteList);
      this.noteList.subscribeToStream(
        `clicksOnNoteList`,
        this.#onClickOnNoteList.bind(this),
      );
    }

    if (this.editingNote) {
      this.editingNote.addElementToPage();
    }

    if (topScroll > 0) {
      this.element.scrollTo(0, topScroll);
    }

    this.scrollButton.switchVisibleButton();
  }

  liveLoadingNoteList(notes) {
    this.noteList.liveLoadingNotes(notes, this.location);
    // this.scrollToDown();
  }

  renderEditingNote(data) {
    if (this.editingNote) {
      this.editingNote.deleteElement();
      this.editingNote = null;
    }

    this.noteList.addOverlay();
    this.disableScrolling();
    this.scrollButton.hideElement();
    this.editingNote = new EditingNote(
      this.element,
      data.note,
      this.#onRequestActionFromEditingNote.bind(this),
    );
    this.editingNote.updateExistTags(this.existTags);
  }

  createContexMenu(target) {
    if (this.contextMenu) {
      this.deleteContextMenu();
    }

    const contextMenuElement = document.createElement(`aside`);
    contextMenuElement.classList.add(`context-menu`);
    contextMenuElement.dataset.id = `contextMenu`;

    let contextMenuBody;
    switch (target.dataset.clickAction) {
      case 'noteContextMenuOpen':
        contextMenuBody = this.#renderContexMenuNote(target);
        break;

      case 'fileNoteContextMenuOpen':
        contextMenuBody = this.#renderContexMenuFileNote(target);
        break;

      case 'noteAttachmentContextMenuOpen':
        contextMenuBody = this.#renderContexMenuNoteAttachment(target);
        break;
    }

    contextMenuElement.append(contextMenuBody);

    this.addRightPadding();
    this.#addOverlayToFeed();
    this.disableScrolling();
    this.contextMenu = new ContextMenu(
      this.element,
      target,
      contextMenuElement,
      this.#onClickContextMenu.bind(this),
    );

    this.contextMenu.setMarginElement(`0.5rem`, `0.2rem`);
    this.contextMenu.addElementToPage();
    this.contextMenu.positiongOnPage();
  }

  deleteContextMenu() {
    this.removeRightPadding();
    this.#removeOverlayFromFeed();
    this.enableScrolling();
    this.contextMenu.deleteElement();
    this.contextMenu = null;
  }

  updateExistTags(tags) {
    this.existTags = tags;

    if (this.editingNote) {
      this.editingNote.updateExistTags(this.existTags);
    }
  }

  #requestEditingNote(idNote) {
    const note = this.noteList.getTargetNoteById(idNote);
    this.addDataToStream(`requestEditingNote`, note);
  }

  #renderContexMenuNote(target) {
    const id = target.dataset.note;
    const targetNote = this.noteList.notes.find((note) => note.id === id);
    const contextMenuBody = document.createElement(`ul`);
    contextMenuBody.classList.add(`context-menu__list`, `not-selected`);

    const pinnedLi = document.createElement(`li`);
    pinnedLi.classList.add(`context-menu__item`, `note-context-menu__item`);
    pinnedLi.dataset.note = id;
    pinnedLi.dataset.targetAction =
      targetNote.pinned === true ? `unpinNote` : `pinNote`;
    pinnedLi.textContent =
      targetNote.pinned === true ? `Открепить` : `Закрепить`;

    const favoriteLi = document.createElement(`li`);
    favoriteLi.classList.add(`context-menu__item`, `note-context-menu__item`);
    favoriteLi.dataset.note = id;
    favoriteLi.dataset.targetAction =
      targetNote.favorite === true ? `removeFromFavorites` : `addToFavorites`;
    favoriteLi.textContent =
      targetNote.favorite === true
        ? `Убрать из избранного`
        : `Добавить в избранное`;

    const editLi = document.createElement(`li`);
    editLi.classList.add(`context-menu__item`, `note-context-menu__item`);
    editLi.dataset.note = id;
    editLi.dataset.targetAction = `editNote`;
    editLi.textContent = `Редактировать`;

    const deleteLi = document.createElement(`li`);
    deleteLi.classList.add(`context-menu__item`, `note-context-menu__item`);
    deleteLi.dataset.note = id;
    deleteLi.dataset.targetAction = `removeNote`;
    deleteLi.textContent = `Удалить`;

    contextMenuBody.append(pinnedLi, favoriteLi, editLi, deleteLi);

    return contextMenuBody;
  }

  #renderContexMenuFileNote(target) {
    const id = target.dataset.file;
    const type = target.dataset.fileType;
    const note = target.dataset.note;

    const contextMenuBody = document.createElement(`ul`);
    contextMenuBody.classList.add(`context-menu__list`, `not-selected`);

    if (type === `image` || type === `video`) {
      contextMenuBody.innerHTML = `
				<li class="context-menu__item file-note-context-menu__item" data-target-action="showFullScreenFileNote" data-file="${id}" data-note=${note} data-file-type=${type}>
		 			На весь экран
				</li>
			`;
    }

    contextMenuBody.innerHTML += `
			<li class="context-menu__item file-note-context-menu__item" data-target-action="downloadFile" data-file="${id}" data-note=${note} data-file-type=${type}>
	 			Скачать
			</li>
			<li class="context-menu__item file-note-context-menu__item" data-target-action="removeFile" data-file="${id}" data-note=${note} data-file-type=${type}>
	 			Удалить
			</li>
		`;
    return contextMenuBody;
  }

  #renderContexMenuNoteAttachment(target) {
    const idFile = target.dataset.file;
    const type = target.dataset.fileType;
    const targetNote = target.closest(`[data-name="feedContentItem"]`);
    const idNote = targetNote.dataset.id;

    const contextMenuBody = document.createElement(`ul`);
    contextMenuBody.classList.add(`context-menu__list`, `not-selected`);

    if (type === `image` || type === `video`) {
      contextMenuBody.innerHTML = `
				<li class="context-menu__item file-context-menu__item" data-target-action="showFullScreenNoteAttachment" data-note="${idNote}" data-file="${idFile}" data-file-type="${type}">
		 			На весь экран
				</li>
			`;
    }

    contextMenuBody.innerHTML += `
			<li class="context-menu__item file-context-menu__item" data-target-action="downloadFile" data-note="${idNote}" data-file="${idFile}" data-file-type="${type}">
	 			Скачать
			</li>
			<li class="context-menu__item file-note-context-menu__item" data-target-action="removeFile" data-note="${idNote}" data-file="${idFile}" data-file-type="${type}">
	 			Удалить
			</li>
		`;
    return contextMenuBody;
  }

  // pinNote(note){
  // 	const noteOnFeedState =	this.noteList.getTargetNoteById(note.id);

  // 	if(noteOnFeedState) {
  // 		noteOnFeedState.pinned = true;
  // 	}

  // 	this.renderPinnedNote(note);
  // }

  // unpinNote(note) {
  // 	const pinnedNote = this.noteList.notes.find(item => item.id === note.id);

  // 	if(pinnedNote) {
  // 		pinnedNote.pinned = false;
  // 	}

  // 	if(this.pinnedNote) {
  // 		this.pinnedNote.deleteElement();
  // 		this.pinnedNote = null;
  // 	}
  // }

  // addNoteToFavorites(note) {
  // 	const targetNote = this.noteList.getTargetNoteById(note.id);

  // 	if(targetNote) {
  // 		targetNote.favorite = true;
  // 	}

  // 	if(this.location.section === `notes` && this.location.category === `favorites`) {
  // 		const idFirstNote = this.noteList.notes[0].id;
  // 		this.addDataToStream(`requestSynchFeed`, {
  // 			section: `notes`,
  // 			category: `favorites`,
  // 			start: idFirstNote,
  // 			end: null,
  // 		})
  // 	}
  // }

  // removeNoteFromFavorites(note) {
  // 	const targetNote = this.noteList.getTargetNoteById(note.id);

  // 	if(targetNote) {
  // 		targetNote.favorite = false;
  // 	}
  // }

  async #downloadFile(data) {
    let file;
    let serverPath = this.server;

    if (data.idFile && this.location.section === `files`) {
      file = this.noteList.getTargetNoteById(data.idFile);
    }

    if (data.idFile && data.idNote && data.type) {
      const targetNote = this.noteList.getTargetNoteById(data.idNote);

      if (targetNote) {
        const targetAttachment = data.type;

        file = targetNote.attachment[targetAttachment]?.find(
          (item) => item.id === data.idFile,
        );
        if (!targetNote.savedOnServer) serverPath = '';
      }
    }

    if (file) {
      const fileUrl = `${serverPath}${file.src}`;
      await downloadFile(fileUrl, file.title);
    }
  }

  // removeFile(data) {
  // 	if(!data.file || !this.noteList) {
  // 		return;
  // 	}

  // 	if(!data.note) {
  // 		this.noteList.removeNote(data.file);
  // 		return
  // 	};

  // 	this.noteList.removeFileAttachment(data)
  // }

  // removeNote(id) {
  // 	this.noteList?.removeNote(id);
  // }

  // changeNote(note, typeNote) {
  // 	const id = typeNote === `created` ?
  // 		note.idCreated :
  // 		note.id

  // 	const targetNote = this.noteList.getTargetNoteById(id)

  // 	if(!targetNote) {
  // 		return
  // 	}

  // 	this.noteList.changeNote(note, typeNote)
  // }

  // #saveEditedNote(note) {
  // 	this.addDataToStream(`saveEditedNote`, note);
  // 	this.removeEditingNote();
  // 	this.changeNote(note, `edited`)
  // }

  removeEditingNote() {
    this.enableScrolling();
    this.scrollButton.showElement();

    if (this.noteList) {
      this.noteList.removeOverlay();
    }

    if (this.editingNote) {
      this.editingNote.deleteElement();
      this.editingNote = null;
    }
  }

  scrollToNote(idNote) {
    const targetNoteElement = this.noteList.getTargetNoteElementById(idNote);
    this.scrollToElement(targetNoteElement);
  }

  scrollToDown() {
    const targetScrollElement =
      this.element.scrollHeight - this.element.clientHeight;

    this.element.scrollTo({
      top: targetScrollElement,
      behavior: 'smooth',
    });

    this.scrollButton.hideElement();
  }

  scrollToElement(element) {
    element.scrollIntoView({
      block: 'center',
      behavior: 'smooth',
    });
  }

  #renderModal(data) {
    if (this.modal) {
      this.modal.deleteElement();
      this.modal = null;
    }

    let modalBody = null;

    switch (data.action) {
      case `removeNote`:
        modalBody = this.#createModalRemoveNote(data.idNote);
        break;

      case `removeFile`:
        modalBody = this.#createModalRemoveFile(data);
        break;

      default:
        return;
    }

    if (modalBody) {
      this.modal = new Modal(modalBody, this.#onClickModal.bind(this));
      this.modal.addElementToPage();

      if (data.action === `removeNote`) {
        this.#createSwitcherModalConfirmRemoveAttachment();
      }
    }
  }

  #createModalRemoveFile(data) {
    const { idFile, idNote, type } = data;

    const modalElement = document.createElement(`aside`);
    modalElement.classList.add(`modal__overlay`, `remove-note`);

    const targetNote =
      idFile && idNote ? this.noteList.getTargetNoteById(idNote) : null;

    const targetFile = targetNote
      ? targetNote.attachment[type].find((item) => item.id === idFile)
      : this.noteList.getTargetNoteById(idFile);

    modalElement.dataset.noteId = idNote;
    modalElement.dataset.fileId = idFile;
    modalElement.dataset.fileType = type;
    modalElement.dataset.id = `modalRemoveFile`;

    modalElement.innerHTML = `
			<div class="modal__body remove-note__container" data-id="modalRemoveBody">
				<h2 class="modal__title remove-note__section remove-note__title">
					Хотите навсегда удалить этот файл?
				</h2>
						
				<div class="remove-note__section remove-note__file-title">
					${targetFile.title}		
				</div>

				<div class="modal__buttons remove-note__section remove-note__buttons">
					<button class="button remove-note__button" data-id="fileRemoveConfirm">
						Удалить
					</button>

					<button class="button remove-note__button" data-id="removeCancel">
						Отмена
					</button>
				</div>
			</div>
		`;
    return modalElement;
  }

  #createModalRemoveNote(idNote) {
    const targetNote = this.noteList.getTargetNoteById(idNote);

    const modalElement = document.createElement(`aside`);
    modalElement.classList.add(`modal__overlay`, `remove-note`);
    modalElement.dataset.noteId = idNote;
    modalElement.dataset.id = `modalRemoveNote`;

    const modalElementBody = document.createElement(`div`);
    modalElementBody.classList.add(`modal__body`, `remove-note__container`);
    modalElementBody.dataset.id = `modalRemoveBody`;

    const modalElementTitle = document.createElement(`h2`);
    modalElementTitle.classList.add(
      `modal__title`,
      `remove-note__section`,
      `remove-note__title`,
    );
    modalElementTitle.textContent = `Хотите навсегда удалить запись?`;
    modalElementBody.append(modalElementTitle);

    for (let key in targetNote.attachment) {
      if (targetNote.attachment[key].length > 0) {
        const confirmRemoveAttachment = document.createElement(`div`);

        confirmRemoveAttachment.classList.add(
          `remove-note-confirm__section`,
          `remove-note-confirm__attachment-remove`,
        );
        confirmRemoveAttachment.dataset.id = `noteRemoveConfirmAttachmentRemove`;
        confirmRemoveAttachment.innerHTML = `
					<div class="remove-note-confirm__attachemnt-remove-text">
						Также удалить вложенные файлы
					</div>

					<div class="slider-button slider-button_active remove-note-confirm__attachemnt-remove-icon" data-id="noteRemoveConfirmAttachmentRemoveIcon" data-confirm="true">
						<div class="button-icon slider-button__switch remove-note-confirm__attachemnt-remove-switch">
						</div>
					</div>
				`;
        modalElementBody.append(confirmRemoveAttachment);
        break;
      }
    }

    const modalElementButtonBlock = document.createElement(`div`);
    modalElementButtonBlock.classList.add(
      `modal__buttons`,
      `remove-note__section`,
      `remove-note__buttons`,
    );
    modalElementButtonBlock.innerHTML = `
			<button class="button remove-note__button" data-id="noteRemoveConfirm">
				Удалить
			</button>

			<button class="button remove-note__button" data-id="removeCancel">
				Отмена
			</button>
		`;
    modalElementBody.append(modalElementButtonBlock);
    modalElement.append(modalElementBody);

    return modalElement;
  }

  #createSwitcherModalConfirmRemoveAttachment() {
    this.modal.switchButton = this.modal.element.querySelector(
      `[data-id="noteRemoveConfirmAttachmentRemoveIcon"]`,
    );
    if (!this.modal.switchButton) {
      return;
    }

    const clicksOnSwitchButton = fromEvent(
      this.modal.switchButton,
      `click`,
    ).pipe(throttleTime(150));

    this.modal.saveStream(`clicksOnSwitchButton`, clicksOnSwitchButton);
    this.modal.subscribeToStream(
      `clicksOnSwitchButton`,
      this.#onClickSwitchConfirmRemoveAttachment.bind(this),
    );

    this.modal.removeAttachment =
      this.modal.switchButton.dataset.confirm === `true` ? true : false;
  }

  #removeModal() {
    this.modal.deleteElement();
    this.modal = null;
  }

  #onClickModal(event) {
    if (!event.target.closest(`[data-id="modalRemoveBody"]`)) {
      this.#removeModal();
    }

    switch (event.target.dataset.id) {
      case `removeCancel`:
        this.#removeModal();
        break;

      case `fileRemoveConfirm`: {
        const fileData = {
          id: this.modal.element.dataset.fileId,
          note: {
            id: this.modal.element.dataset.noteId,
            dates: {
              edited: Date.now(),
            },
          },
          type: this.modal.element.dataset.fileType,
        };
        this.addDataToStream(`removeFile`, fileData);
        this.#removeModal();
        break;
      }

      case `noteRemoveConfirm`: {
        const idNote = this.modal.element.dataset.noteId;
        const removeAttachment = this.modal.removeAttachment;
        const noteForRemoving = {
          id: idNote,
          removeAttachment,
        };
        if (removeAttachment) {
          const targetNote = this.noteList.getTargetNoteById(idNote);
          if (targetNote) {
            noteForRemoving.attachment = targetNote.attachment;
          }
        }
        this.addDataToStream(`removeNote`, noteForRemoving);
        this.#removeModal();
        break;
      }
    }
  }

  #onScrollingFeed(event) {
    this.scrollButton.switchVisibleButton(event);
    if (this.element.scrollTop === 0) {
      this.addDataToStream(`requestLiveLoading`, event);
    }
  }

  #onClickSwitchConfirmRemoveAttachment() {
    if (this.modal.removeAttachment) {
      this.modal.switchButton.classList.remove(`slider-button_active`);
      this.modal.switchButton.dataset.confirm = false;
      this.modal.removeAttachment = false;
      return;
    }

    this.modal.switchButton.classList.add(`slider-button_active`);
    this.modal.switchButton.dataset.confirm = true;
    this.modal.removeAttachment = true;
  }

  #onClickOnPinnedNote(event) {
    const notePinnedElement = event.target.closest(
      `[data-id="feedPinnedNote"]`,
    );
    const idPinnedNote = notePinnedElement.dataset.note;

    if (event.target.closest(`[data-id="feedPinnedUnpin"]`)) {
      this.addDataToStream(`unpinNote`, {
        id: idPinnedNote,
      });
      return;
    }

    const targetNoteElement = this.noteList.element.querySelector(
      `[data-id="${idPinnedNote}"]`,
    );

    if (targetNoteElement) {
      this.scrollToElement(targetNoteElement);
      return;
    }

    this.addDataToStream(`getPinnedNote`, {
      id: idPinnedNote,
    });
  }

  #onClickOnNoteList(event) {
    const targetClick = event.target.closest(`[data-click-action]`);

    if (!targetClick) {
      return;
    }

    if (
      targetClick.dataset.clickAction === `noteSelectTagCategory` &&
      targetClick.dataset.newTag !== `true`
    ) {
      this.addDataToStream(`requestNotesByTag`, targetClick);
      return;
    }

    event.stopPropagation();
    this.createContexMenu(targetClick);
  }

  #onRequestActionFromEditingNote(data) {
    switch (data.action) {
      case `cancel`:
        this.removeEditingNote();
        break;

      case `save`:
        this.addDataToStream(`saveEditedNote`, data.note);
        this.removeEditingNote();
        break;
    }
  }

  #onClickContextMenu(event) {
    const isContextMenu = event.target.closest(`.context-menu`);

    if (!isContextMenu) {
      this.deleteContextMenu();
      return;
    }

    const targetActionElement = event.target.closest(`[data-target-action]`);
    if (!targetActionElement) {
      this.deleteContextMenu();
      return;
    }

    const targetAction = targetActionElement.dataset.targetAction;
    const idNote = targetActionElement.dataset.note || null;
    const idFile = targetActionElement.dataset.file || null;
    const fileType = targetActionElement.dataset.fileType || null;

    this.deleteContextMenu();

    switch (targetAction) {
      case `unpinNote`:
        this.addDataToStream(`unpinNote`, {
          id: idNote,
        });
        break;

      case `pinNote`:
        this.addDataToStream(`pinNote`, {
          id: idNote,
        });
        break;

      case `removeFromFavorites`:
        this.addDataToStream(`removeNoteFromFavorites`, {
          id: idNote,
        });
        // this.removeNoteFromFavorites({
        // 	id: idNote
        // });
        break;

      case `addToFavorites`:
        this.addDataToStream(`addNoteToFavorites`, {
          id: idNote,
        });
        // this.addNoteToFavorites({
        // 	id: idNote
        // });
        break;

      case `showFullScreenFileNote`:
        this.addDataToStream(`showFullScreenMedia`, {
          type: `fileNote`,
          idFile: idFile,
          idNote: null,
          savedOnServer: true,
        });
        break;

      case `showFullScreenNoteAttachment`: {
        const targetNote = this.noteList.getTargetNoteById(idNote);
        this.addDataToStream(`showFullScreenMedia`, {
          type: `noteAttachment`,
          idFile: idFile,
          idNote: idNote,
          savedOnServer: targetNote.savedOnServer,
        });
        break;
      }

      case `downloadFile`:
        this.#downloadFile({
          idFile: idFile,
          idNote: idNote,
          type: fileType,
        });
        break;

      case `editNote`:
        this.#requestEditingNote(idNote);
        break;

      case `removeNote`:
        this.#renderModal({
          idNote: idNote,
          action: `removeNote`,
        });
        break;

      case `removeFile`:
        this.#renderModal({
          idFile: idFile,
          idNote: idNote,
          type: fileType,
          action: `removeFile`,
        });
        break;
    }
  }
}
