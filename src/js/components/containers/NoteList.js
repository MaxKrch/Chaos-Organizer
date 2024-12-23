import BaseComponent from '../../helpers/BaseComponent';
import Note from '../Note';
import File from '../FileNote';
import ContextMenu from '../popups/ContextMenu';
import Modal from '../popups/Modal';

export default class NoteList extends BaseComponent {
	constructor(container, section, notes) {
		super(container);
		this.body = null;
		this.notes = [];

		this.#renderElement(notes, section);
	}

	#renderElement(notes, sectionData) {
		if(!notes && !Array.isArray(notes)) {
			console.log(`Empty element`);
			return;
		}

		const section = sectionData === `files` ?
			`files` :
			`notes`

		this.element = document.createElement(`section`);
		this.element.classList.add(`feed-content`, `feed-${section}`);

		this.body = document.createElement(`ul`);
		this.body.classList.add(`feed-content__list`, `feed-${section}__list`);

		const listNotes = [];
		notes.forEach(note => {
			const noteElement = new Note(this.element, note, sectionData);

			this.notes.push(noteElement)
			listNotes.push(noteElement.element);
		})
		this.body.append(...listNotes)
		this.element.append(this.body);
		// console.log(notes[0].attachment.img[0].src)
	}



	lideLoadingNotes(notes) {

	}

	deleteElement() {
		this.notes.forEach(note => {
			note.removeURLBlobs()
		})
		super.deleteElement()
	}






		// if(this.activeURLBlobs) {
		// 	this.activeURLBlobs.forEach(item => URL.revokeObjectURL(item));
		// 	this.activeURLBlobs = null;
		// }
		
}