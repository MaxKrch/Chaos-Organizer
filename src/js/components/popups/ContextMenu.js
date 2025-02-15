import BaseComponent from '../../helpers/BaseComponent';
import { merge, fromEvent, throttleTime } from 'rxjs';

import { general } from '../../consts/index.js';

export default class ContextMenu extends BaseComponent {
	constructor(container, parent, element, subscriber) {
		super(container);
		this.parent = parent;	
		this.element = element;
		this.marginX = null;
		this.marginY = null;

		this.#createClicksStream(subscriber)
		this.#rePositioningElenentOnPage()
	}

	#createClicksStream(subscriber) {
		const app = document.querySelector(`[data-app-id="${general.appId}"]`);
	
		const clicksStream = fromEvent(app, `click`).pipe(
			throttleTime(350)
		)
		this.saveStream(`clicksStream`, clicksStream);

		if(subscriber) {
			this.subscribeToStream(`clicksStream`, subscriber);	
		}
	}

	#rePositioningElenentOnPage() {
		const resizeWindow = merge(
			fromEvent(window, `orientationchange`),
			fromEvent(window, `resize`),
			fromEvent(this.container, `resize`)
		)
		
		this.saveStream(`resizeWindow`, resizeWindow);
		this.subscribeToStream(`resizeWindow`, this.positiongOnPage.bind(this));
	}

	positiongOnPage() {
		if(!this.container || !this.parent || !this.element) {
			console.log(`empty element`);
			return;
		}

		const coordsContainer = this.container.getBoundingClientRect();
		const coordsParent = this.parent.getBoundingClientRect();
		const coordsElement = this.element.getBoundingClientRect();

		const freeSpaceBottom = coordsContainer.bottom - coordsParent.bottom;

		if(freeSpaceBottom >= coordsElement.height) {
			const elementTop = coordsParent.bottom + this.container.scrollTop - coordsContainer.top
			this.element.style.top = `${elementTop}px`
			if(this.marginY) {
				this.element.style.marginTop = this.marginY;
			}
		
		} else {
			if((coordsParent.top - coordsContainer.top) >= coordsElement.height) {
				const elementTop = coordsParent.top - coordsElement.height + this.container.scrollTop - coordsContainer.top;
				this.element.style.top = `${elementTop}px`
				if(this.marginY) {
					this.element.style.marginTop = `-${this.marginY}`;
				}

			} else {
				const elementTop = coordsContainer.bottom - coordsElement.height + this.container.scrollTop - coordsContainer.top;
				this.element.style.top = `${elementTop}px`;
				if(this.marginY) {
					this.element.style.marginTop = this.marginY;
				}
			}
		}
		
		const freeSpaceLeft = coordsParent.right - coordsContainer.left

		if(freeSpaceLeft >= coordsElement.width) {
			const elementLeft = coordsParent.right - coordsContainer.left - coordsElement.width + this.container.scrollLeft;
			this.element.style.left = `${elementLeft}px`				
			if(this.marginX) {
				this.element.style.marginLeft = this.marginX;
			}
	
		} else {
			const freeSpaceRight = coordsContainer.right - coordsParent.left

			if(freeSpaceRight >= coordsElement.width) {
				const elementLeft = coordsParent.left - coordsContainer.left + this.container.scrollLeft;
				this.element.style.left = `${elementLeft}px`
				if(this.marginX) {
					this.element.style.marginLeft = `-${this.marginX}`;
				}
			
			} else {
				const elementLeft = coordsContainer.Left + this.container.scrollLeft;
				this.element.style.left = `${elementLeft}px`;
				if(this.marginX) {
					this.element.style.marginLeft = this.marginX;
				}
			}
		}
	}

	setMarginElement(marginX, marginY) {
		this.marginX = marginX;
		this.marginY = marginY;
	}
}