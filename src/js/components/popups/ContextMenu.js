import BaseComponent from '../../helpers/BaseComponent';
import { merge, fromEvent } from 'rxjs';

export default class ContextMenu extends BaseComponent {
	constructor(container, parent, element) {
		super(container);
		this.parent = parent;	
		this.container = container;
		this.element = element;

		this.#rePositioningElenentOnPage()
	}

	#rePositioningElenentOnPage() {
		const resizeWindow = merge(
			fromEvent(window, `orientationchange`),
			fromEvent(window, `resize`)
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
			const elementTop = coordsParent.bottom + this.container.scrollTop
			this.element.style.top = `${elementTop}px`

		} else {
			if(coordsParent.top >= coordsElement.height) {
				const elementTop = coordsParent.top - coordsElement.height + this.container.scrollTop;
				this.element.style.top = `${elementTop}px`

			} else {
				const elementTop = coordsContainer.bottom - coordsElement.height + this.container.scrollTop;
				this.element.style.top = `${elementTop}px`;
			}
		}
		
		const freeSpaceRight = coordsContainer.right - coordsParent.left

		if(freeSpaceRight >= coordsElement.width) {
			const elementLeft = coordsParent.left - coordsContainer.left + this.container.scrollLeft;
			this.element.style.left = `${elementLeft}px`
	
		} else {
			const freeSpaceLeft = coordsParent.right - coordsContainer.left
			
			if(freeSpaceLeft >= coordsElement.width) {
				const elementLeft = coordsParent.right - coordsContainer.left - coordsElement.width + this.container.scrollLeft;
				this.element.style.left = `${elementLeft}px`
			
			} else {
				const elementLeft = coordsContainer.Left + this.container.scrollLeft;
				this.element.style.left = `${elementLeft}px`;
			}
		}
	}



}