import BaseComponent from '../../helpers/BaseComponent'
import ContextMenu from '../popups/ContextMenu';
import Modal from '../popups/Modal';

import CreatingNote from '../CreatingNote';

export default class FeedFooter extends BaseComponent {
	constructor(container) {
		super(container);

		this.creatingNote = null;
	}

	initionRender() {
		this.#createElement();
		this.addElementToPage();

		this.creatingNote = new CreatingNote(this.element);

		this.creatingNote.initionRender()
	}

	#createElement() {
		this.element = document.createElement(`footer`);
		this.element.classList.add(`feed-footer`)
	}

	saveCreatingNotesToStorage() {
		const creatingNoteData = this.creatingNote.getElementData();
		
		if(!creatingNoteData) {
			console.log(`empty data`);
			return
		}

		const creatingNoteDataJSON = JSON.stringify(creatingNoteData);
		localStorage.setItem(`creatingNote`, creatingNoteDataJSON)
	}

	loadCreatingNoteFromStorage() {
		const loadedCreatingNoteDataJSON = localStorage.getItem(`creatingNote`);

		if(!loadedCreatingNoteDataJSON) {
			console.log(`empty data`);
			return
		}		

		const loadedCreatingNoteData = JSON.parse(loadedCreatingNoteDataJSON);
		this.creatingNote.upgradeElementData(loadedCreatingNoteData)
	}
}