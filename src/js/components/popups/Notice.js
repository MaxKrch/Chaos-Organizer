import Streams from '../../helpers/Streams';
import { popupVariable } from '../../consts/index.js';

export default class notice extends Streams {
  constructor(data) {
    super();
    this.element = null;
    this.#renderElement(data);
    this.#addEvetsToButtons(data);
    this.#addElementToPage();
  }

  #renderElement(data) {
    this.element = document.createElement(`aside`);
    this.element.classList.add(`notice`);
    this.element.innerHTML = `
			<h2 class="notice__title">
				${data.title}
			</h2>

			<div class="notice__description">
				${data.description}
			</div>

			<div class="notice__buttons">
				<button class="button notice__button notice__confirm" data-id="noticeConfirm"> 
					${data.confirm.title}
				</button>

				<button class="button notice__button notice__cancel" data-id="noticeCancel"> 
					${data.cancel.title}
				</button>
			</div>
		`;
  }

  #addElementToPage() {
    this.container = document.querySelector(popupVariable.container);
    this.container.prepend(this.element);
  }

  #addEvetsToButtons(data) {
    const confirmButton = this.element.querySelector(
      `[data-id="noticeConfirm"]`,
    );
    const cancelButton = this.element.querySelector(`[data-id="noticeCancel"]`);

    confirmButton.addEventListener('click', (event) => {
      event.preventDefault();

      if (data.confirm.callback) {
        data.confirm.callback();
      }

      this.#deleteElement();
    });

    cancelButton.addEventListener('click', (event) => {
      event.preventDefault();

      if (data.cancel.callback) {
        data.cancel.callback();
      }

      this.#deleteElement();
    });
  }

  #deleteElement() {
    this.element.remove();
    this.element = null;
  }
}
