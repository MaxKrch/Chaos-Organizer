import Note from './Note';

export default class TempNote extends Note {
	constructor(note, activeSection) {
		super(note, activeSection, '');
	}
}