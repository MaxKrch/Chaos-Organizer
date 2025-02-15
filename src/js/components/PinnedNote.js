import BaseComponent from '../helpers/BaseComponent';
import ContextMenu from './popups/ContextMenu';
import Modal from './popups/Modal';
import { routes } from '../consts/index.js';

import { fromEvent, throttleTime } from 'rxjs';

export default class PinnedNote extends BaseComponent {
	constructor(container, note) {
		super(container);
		this.#renderElement(note);
	}

	#renderElement(note) {
		this.element = document.createElement(`section`);
		this.element.classList.add(`feed-pinned`);
		this.element.dataset.id = "feedPinnedNote";

		this.element.dataset.note = note.id;
		this.element.innerHTML = this.#createBodyElement(note);

		this.staticElements.closeBtn = this.element.querySelector(`[data-id="feedPinnedUnpin"]`);
	}

	#createBodyElement(note) {
		const imgElement = note.img ?
			this.#createImgElement(note.img) :
			``
		const body =`
			${imgElement}
				
			<div class="feed-pinned__item feed-pinned__text not-selected" data-id="feedPinnedNoteText">
				${note.text}	
			</div>
											
			<div class="feed-pinned__item button-icon figure-button feed-pinned__unpin" data-id="feedPinnedUnpin">
				<div class="figure-button__item figure-button__cross feed-pinned__unpin-cross">
				</div>
			</div>
		`
		return body;
	}

	#createImgElement(img) {
		const imgElement = `
			<div class="feed-pinned__item feed-pinned__img">
				<img src="${routes.server}${img.src}" alt="${img.name}" class="feed-pinned__img-item" data-id="feedPinnedNoteImg">
			</div>
		`
		return imgElement;
	}

	addElementToPage() {
		this.container.prepend(this.element)
	}
}