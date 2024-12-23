import BaseComponent from '../../helpers/BaseComponent'
import ContextMenu from '../popups/ContextMenu';
import Modal from '../popups/Modal';

import PinnedNote from '../PinnedNote';
import NoteList from '../containers/NoteList';
import FeedFiles from '../containers/FeedFiles';
import FeedScrollButton from '../FeedScrollButton';
import PreloadFeed from '../PreloadFeed';
import EditingNote from '../EditingNote';

import { Subject, fromEvent, throttleTime } from 'rxjs';

export default class FeedMain extends BaseComponent {
	constructor(container) {
		super(container);

		this.pinnedNote = null;
		this.noteList = null;
		this.preloadFeed = null;
		this.editingNote = null;
		this.scrollButton = null;
		
		this.activeSection = null;

		this.modal = null;
		this.contextMenu = null;
	}

	initionRender() {
		this.#createElement();		
		this.addElementToPage();

		this.scrollButton = new FeedScrollButton(this.element);
		this.scrollButton.addElementToPage()


		this.#createStreams();
		this.#subscribeToStreams();
	}

	#createElement() {
		this.element = document.createElement(`main`);
		this.element.classList.add(`feed-main`)
	}

	#createStreams() {
		this.saveStream(`clicksOnPinnedNote`, new Subject());
		this.saveStream(`clicksOnNoteList`, new Subject());
		this.saveStream(`clicksOnEditingNote`, new Subject());
		// this.saveStream(`saveEditingNote`, new Subject())
		// this.saveStream(`cancelEditigNote`, new Subject())
		// this.saveStream(`removeNote`, new Subject())
	}

	#subscribeToStreams() {

	}

	renderPreloadFeed(type) {
		if(this.pinnedNote) {
			this.pinnedNote.removeFromPage()
		}

		if(this.noteList) {
			this.noteList.removeFromPage()
		}

		if(this.editingNote) {
			this.editingNote.removeFromPage()
		}

		this.disableScrolling()

		this.preloadFeed = new PreloadFeed(this.element, type);
		this.preloadFeed.addElementToPage();
	}

	deletePreloadFeed() {
		this.enableScrolling();

		if(this.preloadFeed) {
			this.preloadFeed.deleteElement();
			this.preloadFeed = null;
		}
	}

	setActiveSection(section) {
		this.activeSection = section;
	}

	renderPinnedNote(note) {
		if(this.pinnedNote) {
			this.pinnedNote.deleteElement()
		}

		this.pinnedNote = new PinnedNote(this.element, note);

		if(!this.preloadFeed) {
			if(this.activeSection === `notes` || this.activeSection === `tag`) {
				this.pinnedNote.addElementToPage();
			}
		}

		const clicksOnPinnedNote = fromEvent(this.pinnedNote.element, `click`).pipe(
			throttleTime(350)
		)
		this.pinnedNote.saveStream(`clicksOnPinnedNote`, clicksOnPinnedNote)
		this.pinnedNote.subscribeToStream(`clicksOnPinnedNote`, this.#onClickOnPinnedNote.bind(this))
	}

	renderNewNoteList(notes) {
		if(this.preloadFeed) {
			this.deletePreloadFeed()
		}

		if(this.pinnedNote) {
			if(this.activeSection === `files`) {
				this.pinnedNote.removeElementFromPage()
			} else {
				this.pinnedNote.addElementToPage()
			}
		} 
		
		if(this.noteList) {
			this.noteList.deleteElement();			
		}

		this.noteList = new NoteList(this.element, this.activeSection, notes);
		this.noteList.addElementToPage()
		this.scrollToDown();

		const clicksOnNoteList = fromEvent(this.noteList.element, `click`).pipe(
			throttleTime(350)
		)
		this.noteList.saveStream(`clicksOnNoteList`, clicksOnNoteList)
		this.noteList.subscribeToStream(`clicksOnNoteList`, this.#onClickOnNoteList.bind(this))
	}

	liveLoadingNoteList(notes) {	
		console.log(2, notes)
		this.scrollToDown();
	}

	renderEditingNote(note) {

	}

	scrollToDown() {
		const coordsElement = this.element.getBoundingClientRect()
		const targerScrollElement = this.element.scrollHeight - this.element.clientHeight;
		this.element.scrollTo(0, targerScrollElement)
	}

	scrollToElement(element) {
		element.scrollIntoView(true)
	}




	clearElement() {

	}

	clearNoteList() {

	}

	cleatFileList() {

	}



	removeNoteList() {

	}

	removeFileList() {

	}

	#onClickOnPinnedNote(event) {
		console.log(`event`)
		// this.addDataToStream(`clicksOnPinnedNote`, event)
	}

	#onClickOnNoteList(event) {
		console.log(`event`)
		// this.addDataToStream(`clicksOnNoteList`, event)
	}

}