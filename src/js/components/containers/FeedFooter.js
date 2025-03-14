import BaseComponent from '../../helpers/BaseComponent';
import ModalNotSavedNotesFiles from '../popups/ModalNotSavedNotesFiles';
import { Subject } from 'rxjs';

import CreatingNote from '../CreatingNote';

export default class FeedFooter extends BaseComponent {
  constructor(container) {
    super(container);

    this.creatingNote = null;
    this.modal = null;
  }

  initionRender() {
    this.#createElement();
    this.#createStreams();
    this.#subscribeToStreams();
    this.addElementToPage();

    this.creatingNote = new CreatingNote(
      this.element,
      this.#onRequestActionFromCreatingPanel.bind(this),
    );
  }

  #createElement() {
    this.element = document.createElement(`footer`);
    this.element.classList.add(`feed-footer`);
  }

  #createStreams() {
    this.saveStream(`requestEnableFullPanelCreatingNote`, new Subject());
    this.saveStream(`requestDisableFullPanelCreatingNote`, new Subject());
    this.saveStream(`requestSaveCreatedNote`, new Subject());
  }

  #subscribeToStreams() {}

  saveCreatingNotesToStorage() {
    this.creatingNote.saveNoteToLocalStorage();
  }

  clearCreatingNote() {
    this.creatingNote.clearDataCreatingNote();
  }

  showModalSavedNote(messages) {
    if (this.modal) {
      this.removeModal();
    }

    this.modal = new ModalNotSavedNotesFiles(
      this.#onClickByModal.bind(this),
      messages,
    );
  }

  removeModal() {
    if (this.modal) {
      this.modal.deleteElement();
      this.modal = null;
    }
  }

  #onClickByModal(event) {
    if (!event.target.closest(`[data-id="modalUploadFilesErrorBody"]`)) {
      this.removeModal();
      return;
    }

    if (event.target.closest(`[data-target-action="closeUploadFilesError"]`)) {
      this.removeModal();
      return;
    }
  }

  #onRequestActionFromCreatingPanel(data) {
    switch (data.action) {
      case `enableFullPanelCreatingNote`:
        this.addDataToStream(`requestEnableFullPanelCreatingNote`, data.action);
        break;

      case `disableFullPanelCreatingNote`:
        this.addDataToStream(
          `requestDisableFullPanelCreatingNote`,
          data.action,
        );
        break;

      case `saveCreatedNote`:
        this.addDataToStream(`requestSaveCreatedNote`, data.note);
        break;
    }
  }
}
