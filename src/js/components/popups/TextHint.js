import ContextMenu from './ContextMenu';

export default class TextHint extends ContextMenu {
	constructor(container, parent, text) {
		super(container, parent, null, null);
		this.#initElement(text);
	}

	#initElement(text) {
		this.#renderElement(text);
		this.addElementToPage();
		this.positiongOnPage()
	}

	#renderElement(text) {
		this.element = document.createElement(`section`);
		this.element.classList.add(`note-sending__text-hint`)
		this.element.textContent = text;
	}
}