import BaseComponent from '../../helpers/BaseComponent'
import ContextMenu from '../popups/ContextMenu';
import Modal from '../popups/Modal';

import PinnedNote from '../PinnedNote';
import NoteFeed from '../containers/NoteFeed';
import FileFeed from '../containers/FileFeed';
import PreloadFeed from '../PreloadFeed';
import EditingNote from '../EditingNote';

export default class FeedMain extends BaseComponent {
	constructor(container) {
		super(container);

		this.pinnedNote = null;
		this.noteFeed = null;
		this.preloadFeed = null;
		this.editingNote = null;
		
		this.modal = null;
		this.contextMenu = null;
	}

	initionRender() {
		this.#createElement();
		this.addElementToPage()
	}

	#createElement() {
		this.element = document.createElement(`main`);
		this.element.classList.add(`feed-main`)
	}

	renderPreloadFeed(type) {
		this.disableScrolling()
		this.preloadFeed = new PreloadFeed(this.element);
		this.preloadFeed.createElement(type);
		this.preloadFeed.addElementToPage();
	}

	deletePreloadFeed() {
		if(!this.preloadFeed) {
			comsole.log(`empty element`);
			return;
		}

		this.enableScrolling();
		this.preloadFeed.deleteElement();
		this.preloadFeed = null;
	}
}