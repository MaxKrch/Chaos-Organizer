import BaseComponent from '../../helpers/BaseComponent'
import ContextMenu from '../popups/ContextMenu';
import Modal from '../popups/Modal';
import { Subject } from 'rxjs';

import CreatingNote from '../CreatingNote';

export default class FeedFooter extends BaseComponent {
	constructor(container) {
		super(container);

		this.creatingNote = null;
	}

	initionRender() {
		this.#createElement();
		this.#createStreams();
		this.#subscribeToStreams()
		this.addElementToPage();

		this.creatingNote = new CreatingNote(this.element, this.#onRequestActionFromCreatingPanel.bind(this));
	}

	#createElement() {
		this.element = document.createElement(`footer`);
		this.element.classList.add(`feed-footer`)
	}

	#createStreams() {
		this.saveStream(`requestEnableFullPanelCreatingNote`, new Subject());
		this.saveStream(`requestDisableFullPanelCreatingNote`, new Subject());
		this.saveStream(`requestSaveCreatedNote`, new Subject())
	}

	#subscribeToStreams() {}

	saveCreatingNotesToStorage() {
		this.creatingNote.saveNoteToLocalStorage();
	}

	clearCreatingNote() {
		this.creatingNote.clearDataCreatingNote()
	}

	#onRequestActionFromCreatingPanel(data) {
		switch(data.action) {
			case `enableFullPanelCreatingNote`:
				this.addDataToStream(`requestEnableFullPanelCreatingNote`, data.action);
				break;

			case `disableFullPanelCreatingNote`:
				this.addDataToStream(`requestDisableFullPanelCreatingNote`, data.action);
				break;

			case `saveCreatedNote`:	
				this.addDataToStream(`requestSaveCreatedNote`, data.note);
				break
		}
	}
}