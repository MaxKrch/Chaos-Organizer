import BaseComponent from '../helpers/BaseComponent.js';
import { fromEvent, throttleTime } from 'rxjs';

export default class ScrollButtons extends BaseComponent {
	constructor(container) {
		super(container);
		
		this.#renderElement();
		this.#createStreams()
	}

	#renderElement() {
		this.element = document.createElement(`section`);
		this.element.classList.add(`button-icon`, `icon_active-size`, `feed-scroll-down`, `hidden-item`);
		this.element.dataset.id = "feedScrollDown";
		this.element.innerHTML = `
			<div class="feed-scroll-down__button">
			</div>
		`
	}

	#createStreams() {
		const scrollToDown = fromEvent(this.element, `click`).pipe(
			throttleTime(350)
		)
		this.saveStream(`scrollToDown`, scrollToDown);
	}
}