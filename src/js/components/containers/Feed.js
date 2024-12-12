import BaseComponent from '../../helpers/BaseComponent'
import ContextMenu from '../popups/ContextMenu';
import Modal from '../popups/Modal';

import FeedHeader from '../FeedHeader';
import FeedMain from './FeedMain';
import FeedFooter from './FeedFooter';

import { fromEvent, throttleTime, filter, Subject } from 'rxjs';

export default class Feed extends BaseComponent {
	constructor(container) {
		super(container);

		this.header = null; 
		this.main = null; 	
		this.footer = null; 
		this.modal = null;
		this.contextMenu = null;
	}

	initionRender() {
		this.#createElement();
		this.addElementToPage();

		this.header = new FeedHeader(this.element); 
		this.main = new FeedMain(this.element); 	
		this.footer = new FeedFooter(this.element);

		this.header.initionRender();
		this.main.initionRender();
		this.footer.initionRender();

		this.#createStreams();
		this.#subscribeToStreams();
	}

	#createElement() {
		this.element = document.createElement(`article`);
		this.element.classList.add(`feed`);
	}

	shiftContent() {
		this.element.classList.add(`feed_shifted`);
	}

	unShiftContent() {
		this.element.classList.remove(`feed_shifted`);
	}

	createStreamClickOnSectionOverlay() {
		const stream = fromEvent(this.element, `click`).pipe(
			filter(item => item.target.closest('[data-overlay="true"]')),
			throttleTime(500),
		)

		this.saveStream(`clickOnSectionOverlay`, stream)
	}

	#createStreams() {
		this.saveStream(`login`, new Subject());
		this.saveStream(`logout`, new Subject());

	}

	#subscribeToStreams() {
		this.header.subscribeToStream(`clicksOnSign`, this.onClickByHeaderSign.bind(this))
	}

	onClickByHeaderSign(event) {
		console.log(event)
		if(!event) {
			console.log(`empty event`);
			return
		}

		const action = event.target.auth === 'true' ?
			this.addDataToStream(`logout`, `out`) :
			this.addDataToStream(`login`, `in`);
	}
}