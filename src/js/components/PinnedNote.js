import BaseComponent from '../helpers/BaseComponent';

export default class PinnedNote extends BaseComponent {
  constructor(container, note, serverPath) {
    super(container);
    this.serverPath = serverPath;
    this.#renderElement(note);
  }

  #renderElement(note) {
    this.element = document.createElement(`section`);
    this.element.classList.add(`feed-pinned`);
    this.element.dataset.id = 'feedPinnedNote';

    this.element.dataset.note = note.id;
    this.element.innerHTML = this.#createBodyElement(note);

    this.staticElements.closeBtn = this.element.querySelector(
      `[data-id="feedPinnedUnpin"]`,
    );
  }

  #createBodyElement(note) {
    const imgElement = note.img ? this.#createImgElement(note.img) : ``;
    const body = `
			${imgElement}
				
			<div class="feed-pinned__item feed-pinned__text not-selected" data-id="feedPinnedNoteText">
				${note.text}	
			</div>
											
			<div class="feed-pinned__item button-icon figure-button feed-pinned__unpin" data-id="feedPinnedUnpin">
				<div class="figure-button__item figure-button__cross feed-pinned__unpin-cross">
				</div>
			</div>
		`;
    return body;
  }

  #createImgElement(img) {
    const imgElement = `
			<div class="feed-pinned__item feed-pinned__img">
				<img src="${this.serverPath}${img.src}" alt="${img.name}" class="feed-pinned__img-item" data-id="feedPinnedNoteImg">
			</div>
		`;
    return imgElement;
  }

  addElementToPage() {
    this.container.prepend(this.element);
  }
}
