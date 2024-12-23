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
		this.saveStream(`requestLogin`, new Subject());
		this.saveStream(`requestLogout`, new Subject());
		this.saveStream(`editNote`, new Subject());
		this.saveStream(`saveNewNote`, new Subject());
		this.saveStream(`removeNote`, new Subject());
		this.saveStream(`requestNotes`, new Subject());

	}

	#subscribeToStreams() {
		this.header.subscribeToStream(`requestLogin`, this.#requestLogin.bind(this))
		this.header.subscribeToStream(`requestLogout`, this.#requestLogout.bind(this))
		this.main.scrollButton.subscribeToStream(`scrollToDown`, this.#scrollToDown.bind(this));





			// 	this.main.subscribeToStream(`requestGoToDown`, this.#onequestUnpinPinnedNote.bind(this))


		this.main.subscribeToStream(`clicksOnPinnedNote`, this.#onClickByMainPinnedNote.bind(this));
		this.main.subscribeToStream(`clicksOnNoteList`, this.#onClickByMainNoteList.bind(this));
			// this.main.subscribeToStream(`requestUnpinNote`, this.#onequestUnpinPinnedNote.bind(this))
			// 	this.main.subscribeToStream(`requestGoToPinnedNote`, this.#onequestUnpinPinnedNote.bind(this))
			// 					this.main.subscribeToStream(`requestPinNote`, this.#onequestUnpinPinnedNote.bind(this))
			// 													this.main.subscribeToStream(`requestAddToFavoriteNote`, this.#onequestUnpinPinnedNote.bind(this))
			// 		this.main.subscribeToStream(`requestLiveLoading`, this.#onequestUnpinPinnedNote.bind(this))
			// 			this.main.subscribeToStream(`requestDeleteNote`, this.#onequestUnpinPinnedNote.bind(this))
			// 			this.main.subscribeToStream(`requestEditNote`, this.#onequestUnpinPinnedNote.bind(this))
			// 									this.main.subscribeToStream(`requestSaveEditingNote`, this.#onequestUnpinPinnedNote.bind(this))

			// 																		this.main.subscribeToStream(`requestSaveNewNote`, this.#onequestUnpinPinnedNote.bind(this))
			// 					this.main.subscribeToStream(`requestSelecCategoryByTag`, this.#onequestUnpinPinnedNote.bind(this))								this.main.subscribeToStream(`requestFullShowMedia`, this.#onequestUnpinPinnedNote.bind(this))

//endMainStreams






	}


	initionCreatingNote() {
		this.footer.loadCreatingNoteFromStorage();
	}

	createPinnedNote(pinnedNote) {		
		this.main.renderPinnedNote(pinnedNote);
	}

	createNewNoteList(listNotes, section) {
 		this.main.setActiveSection(section)
		this.main.renderNewNoteList(listNotes, section)
	}

	#requestLogin(event) {
		this.addDataToStream(`requestLogin`, event)
	}

	#requestLogout(event) {
		this.addDataToStream(`requestLogout`, event)
	}

	#scrollToDown(event) {
		console.log(event)
	}



	#onClickByMainPinnedNote(event) {
		console.log(event)
	}

	#onClickByMainNoteList(event) {
		console.log(event)
	}

}
