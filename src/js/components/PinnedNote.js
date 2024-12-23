import BaseComponent from '../helpers/BaseComponent';
import ContextMenu from './popups/ContextMenu';
import Modal from './popups/Modal';

import { fromEvent, throttleTime } from 'rxjs';

export default class PinnedNote extends BaseComponent {
	constructor(container, note) {
		super(container);
		this.img = null;

		this.#renderElement(note);
	}

	async #renderElement(note) {
		if(!note) {
			console.log(`empty element`);
			return
		}

		this.element = document.createElement(`section`);
		this.element.classList.add(`feed-pinned`);
		this.element.dataset.id = "feedPinnedNote";
		this.element.dataset.note = note.id;
		this.element.innerHTML = await this.#createBodyElement(note);

		this.staticElements.closeBtn = this.element.querySelector(`[data-id="feedPinnedUnpin"]`);

		this.img = note.img ?
			this.element.querySelector(`[data-id="feedPinnedNoteImg"]`) :
			null;
	}

	async #createBodyElement(note) {
		const imgElement = note.img ?
			await this.#createImgElement(note.img) :
			``
		const body =`
			${imgElement}
				
			<div class="feed-pinned__item feed-pinned__text" data-id="feedPinnedNoteText">
				${note.text}	
			</div>
											
			<div class="feed-pinned__item button-icon figure-button feed-pinned__unpin" data-id="feedPinnedUnpin">
				<div class="figure-button__item figure-button__cross feed-pinned__unpin-cross">
				</div>
			</div>
		`
		return body;
	}

	async #createImgElement(img) {
		const imgBlobLink = await this.#createLinkFromBlob(img.src);

		const imgElement = `
			<div class="feed-pinned__item feed-pinned__img">
				<img src="${imgBlobLink}" alt="${img.name}" class="feed-pinned__img-item" data-id="feedPinnedNoteImg">
			</div>
		`
		return imgElement;
	}

	async #createLinkFromBlob(blob) {

console.log(`delete async and code`)


	const response = await fetch(blob)
	const blobFile = await response.blob()
	const blobLink = URL.createObjectURL(blobFile)

console.log(`delete`)


		// const blobLink = URL.createObjectURL(blob);

		return blobLink;
	}

	addElementToPage() {
		this.container.prepend(this.element)
	}

	deleteElement() {
		if(this.img) {
			URL.revokeObjectURL(this.img.src)
		}

		super.deleteElement()
	}

}