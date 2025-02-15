import BaseComponent from '../helpers/BaseComponent.js';
import { fromEvent, throttleTime, merge } from 'rxjs';

export default class ScrollButtons extends BaseComponent {
	constructor(container) {
		super(container);

		this.#initElement()
	}

	#initElement() {
		this.#renderElement();
		this.#createStreams();
		this.#rePositioningElenentOnPage()
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

	#rePositioningElenentOnPage() {
		const resizeWindow = merge(
			fromEvent(window, `orientationchange`),
			fromEvent(window, `resize`)
		)
		
		this.saveStream(`resizeWindow`, resizeWindow);
		this.subscribeToStream(`resizeWindow`, this.positiongElementOnPage.bind(this));
	}

	positiongElementOnPage() {
		const containerCoords = this.container.getBoundingClientRect();
		const leftButton = `calc(${containerCoords.right}px - 3rem)`;
		const indentBottom = document.documentElement.clientHeight - containerCoords.bottom;
		const bottomButton = `calc(${indentBottom}px + 0.5rem)`;

		this.element.style.left = leftButton;
	 	this.element.style.bottom = bottomButton;
	}

	switchVisibleButton() {
		const scrollBottom = this.container.scrollHeight - (this.container.scrollTop + this.container.clientHeight)
		
		scrollBottom > this.container.clientHeight ?
			this.showElement() :
			this.hideElement()
	}
}