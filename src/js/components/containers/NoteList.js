import BaseComponent from '../../helpers/BaseComponent';
import Note from '../Note';
import TempNote from '../TempNote';
import ContextMenu from '../popups/ContextMenu';
import Modal from '../popups/Modal';
import TextHint from '../popups/TextHint';
import { routes } from '../../consts/index.js';

import { fromEvent, debounceTime } from 'rxjs';

export default class NoteList extends BaseComponent {
	constructor(container, section, notes) {
		super(container);
		this.body = null;
		this.notes = [];
		this.activeSection = null;
		this.textHint = null;

		this.#initElement(notes, section);
	}

	#initElement(notes, section) {
		this.activeSection = section === `files` ?
			`files` :
			`notes`

		this.#renderElement(notes, section);
		this.#createStreams();
		this.#subscribeToStreams();
	}

	#renderElement(notes) {
		this.element = document.createElement(`section`);
		this.element.classList.add(`feed-content`, `feed-${this.activeSection}`);

		this.body = document.createElement(`ul`);
		this.body.classList.add(`feed-content__list`, `feed-${this.activeSection}__list`);
		
		const listNotes = [];
		
		if(notes && Array.isArray(notes)) {
			notes.forEach(note => {
				const noteElement = new Note(note, this.activeSection, routes.server);
	
				this.notes.push(note)
				listNotes.push(noteElement);
			})
			this.body.append(...listNotes);
		}

		this.element.append(this.body);
	}

	#createStreams() {
		const mouseMoveOnElement = fromEvent(this.element, `mousemove`).pipe(
			debounceTime(150)
		)

		this.saveStream(`mouseMoveOnElement`, mouseMoveOnElement);
	}

	#subscribeToStreams() {
		this.subscribeToStream(`mouseMoveOnElement`, this.#onMouseMoveOnElement.bind(this));
	}

	liveLoadingNotes(notes) {
		if(!notes && !Array.isArray(notes)) {
			console.log(`Empty element`);
			return;
		}

		const loadingNotes = [];
		notes.forEach(note => {
			const noteElement = new Note(note, this.activeSection, routes.server);

			this.notes.push(note)
			loadingNotes.push(noteElement);
		})
		this.body.append(...loadingNotes);
	}

	replaceElement(note, noteElement) {
		const newNoteElement = new Note(note, this.activeSection, routes.server);
		noteElement.replaceWith(newNoteElement);
	}

	removeFileAttachment(data) {		
		const targetNoteElement = this.getTargetNoteElementById(data.note);
		const targetNote = this.getTargetNoteById(data.note);

		if(!targetNoteElement || !targetNote) {
			return;
		}

		const targetAttachments = targetNote.attachment[data.type];
		const indexTargetFile = targetAttachments.findIndex(item => item.id === data.file);

		if(indexTargetFile < 0) {
			return;
		}

		targetAttachments.splice(indexTargetFile, 1);

		this.replaceElement(targetNote, targetNoteElement);
	}

	removeNote(id) {
		const targetNoteElement = this.getTargetNoteElementById(id);
		const indexTargetNote = this.notes.findIndex(item => item.id === id);

		if(!targetNoteElement || indexTargetNote < 0) {
			return;
		}

		this.notes.splice(indexTargetNote, 1)
		targetNoteElement.remove()
	}

	changeNote(note, typeNote) {
		const id = typeNote === `created` ?
			note.idCreated :
			note.id

		const targetNoteElement = this.getTargetNoteElementById(id);		
		const targetNote = this.getTargetNoteById(id);

		if(!targetNoteElement || !targetNote) {
			return;
		}

		if(this.textHint) {
			this.#removeTextHintSendingNote();		
		}

		if(typeNote === `created`) {
			for(let key in targetNote.attachment) {
				if(Array.isArray(targetNote.attachment[key])) {
					targetNote.attachment[key].forEach(item => URL.revokeObjectURL(item.url))
				}
			}
		}	

		this.notes.splice(indexTargetNote, 1, note);
		this.replaceElement(note, targetNoteElement);
	}

	addCreatedNoteToFeed(note) {
		const noteElement = new TempNote(note, this.activeSection);
		this.notes.push(note);
		this.body.append(noteElement)
	}

	getTargetNoteById(id) {
		const targetNote = this.notes.find(item => item.id === id);
		return targetNote;
	}

	getTargetNoteElementById(id) {
		const targetNoteElement = this.element.querySelector(`[data-name="feedContentItem"][data-id="${id}"]`);
		return targetNoteElement;
	}

	#createTextHintSendingNote(target) {
		if(this.textHint) {
			this.#removeTextHintSendingNote()
		}

		const targetNote = target.closest(`[data-name="feedContentItem"]`)
		this.textHint = new TextHint(this.container, target, `Ожидает отправки на сервер`)
	}

	#removeTextHintSendingNote() {
		this.textHint.deleteElement();
		this.textHint = null;
	}

	#onMouseMoveOnElement(event) {
		const isSendindStatusElement = event.target.closest(`[data-name="feedNoteSending"]`);

		if(isSendindStatusElement && isSendindStatusElement.dataset.sendingStatus === `await`) {
			this.#createTextHintSendingNote(isSendindStatusElement);
			return;
		}
		
		if(this.textHint) {
			this.#removeTextHintSendingNote()
		}
	}
}