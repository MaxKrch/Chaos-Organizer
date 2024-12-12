import BaseComponent from '../../helpers/BaseComponent'
import ContextMenu from '../popups/ContextMenu';
import Modal from '../popups/Modal';

import CreatingNote from '../CreatingNote';

export default class FeedFooter extends BaseComponent {
	constructor(container) {
		super(container);

		this.creatingNote = new CreatingNote(null);
	}

	initionRender() {
		this.#createElement();
		this.addElementToPage();

		this.creatingNote.container = this.element;
		this.creatingNote.initionRender()
	}

	#createElement() {
		this.element = document.createElement(`footer`);
		this.element.classList.add(`feed-footer`)
	}
}