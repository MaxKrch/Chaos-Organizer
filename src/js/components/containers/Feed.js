import BaseComponent from '../../helpers/BaseComponent'
import ContextMenu from '../popups/ContextMenu';
import Modal from '../popups/Modal';
import FullScreenMedia from '../FullScreenMedia';

import FeedHeader from '../FeedHeader';
import FeedMain from './FeedMain';
import FeedFooter from './FeedFooter';

import { fromEvent, throttleTime, filter, Subject } from 'rxjs';

export default class Feed extends BaseComponent {
	constructor(container) {
		super(container);

		this.existTags = null;

		this.header = null; 
		this.main = null; 
		this.footer = null; 
		
		this.modal = null;
		this.contextMenu = null;
		this.fullScreenMedia = null;
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

		this.main.scrollButton.positiongElementOnPage()

		this.#createStreams();
		this.#subscribeToStreams();
	}

	#createElement() {
		this.element = document.createElement(`article`);
		this.element.dataset.id = `appFeed`
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

		this.saveStream(`selectTagCategory`, new Subject());

		this.saveStream(`getPinnedNote`, new Subject());
		this.saveStream(`pinNote`, new Subject());
		this.saveStream(`unpinNote`, new Subject());

		this.saveStream(`addNoteToFavorite`, new Subject());
		this.saveStream(`removeNoteFromFavorite`, new Subject());

		this.saveStream(`saveEditedNote`, new Subject());
		this.saveStream(`saveCreatedNote`, new Subject());

		this.saveStream(`removeNote`, new Subject());
		this.saveStream(`removeFile`, new Subject())

		this.saveStream(`requestNotes`, new Subject());
		this.saveStream(`requestLiveLoading`, new Subject());
		this.saveStream(`requestSynchFeed`, new Subject());

	}

	#subscribeToStreams() {
		this.header.subscribeToStream(`requestLogin`, this.#requestLogin.bind(this))
		this.header.subscribeToStream(`requestLogout`, this.#requestLogout.bind(this))
		
		this.main.subscribeToStream(`requestNotesByTag`, this.#requestNotesByTag.bind(this));
		this.main.subscribeToStream(`requestLiveLoading`, this.#requestLiveLoading.bind(this))
		this.main.subscribeToStream(`requestSynchFeed`, this.#requestSynchFeed.bind(this));

		this.main.subscribeToStream(`getPinnedNote`, this.#getPinnedNote.bind(this));
		this.main.subscribeToStream(`pinNote`, this.#pinNote.bind(this));
		this.main.subscribeToStream(`unpinNote`, this.#unpinNote.bind(this));

		this.main.subscribeToStream(`showFullScreenMedia`, this.#showFullScreenMedia.bind(this));

		this.main.subscribeToStream(`removeFile`, this.#requestRemoveFile.bind(this));
		this.main.subscribeToStream(`removeNote`, this.#requestRemoveNote.bind(this));
	
		this.main.subscribeToStream(`requestEditingNote`, this.#requestEditingNote.bind(this));
		this.main.subscribeToStream(`saveEditedNote`, this.#requestSaveEditedNote.bind(this));

		this.footer.subscribeToStream(`requestEnableFullPanelCreatingNote`, this.#enableFullPanelCreatingNote.bind(this));
		this.footer.subscribeToStream(`requestDisableFullPanelCreatingNote`, this.#disableFullPanelCreatingNote.bind(this));

		this.footer.subscribeToStream(`requestSaveCreatedNote`, this.#requestSaveCreatedNote.bind(this));
	}

	createPinnedNote(pinnedNote) {		
		this.main.renderPinnedNote(pinnedNote);
	}

	createNoteList(noteList) {
 		// this.main.setActiveLocation(location)
		this.main.renderNoteList(noteList)
	}

	updateExistTags(tags) {
		if(!tags) {
			return;
		}

		this.existTags = tags;
		this.main.updateExistTags(this.existTags)
		this.footer.creatingNote.updateExistTags(this.existTags);		
	}

	#requestLogin(event) {
		this.addDataToStream(`requestLogin`, event)
	}

	#requestLogout(event) {
		this.addDataToStream(`requestLogout`, event)
	}

	#unpinNote(idNote) {
		this.addDataToStream(`unpinNote`, idNote);
	}

	#getPinnedNote(idNote) {
		this.addDataToStream(`getPinnedNote`, idNote);
	}

	#pinNote(idNote) {
		this.addDataToStream(`pinNote`, idNote)
	}

	#requestNotesByTag(target) {
		const targetNotes = {
			section: `tag`,
			tag: target.dataset.tag,
			start: null,
			end: null,
		}

		this.addDataToStream(`requestNotes`, targetNotes)
	}

	#requestSynchFeed(target) {
		this.addDataToStream(`requestSynchFeed`, target)
	}

	#requestLiveLoading(target) {
		this.addDataToStream(`requestLiveLoading`, target)
	}

	#showFullScreenMedia(target) {
		if(this.fullScreenMedia) {
			this.#removeFullScrenMedia()
		}

		const targetId = target.type === `fileNote` ?
			target.idFile :
			target.idNote

		const targetNote = this.main.noteList.notes.find(note => note.id === targetId);

		const media = target.type === `fileNote` ?
			targetNote :
			[]

		if(target.type === `noteAttachment`) {
			if(targetNote.attachment.video) {
				targetNote.attachment.video.forEach(video => media.push({
					...video,
					type: `video`,
				}))
			}

			if(targetNote.attachment.image) {
				targetNote.attachment.image.forEach(image => media.push({
					...image,
					type: `image`,
				}))
			}
		}

		const data = {
			media,
			source: target.type,
			idFile: target.idFile,
			idNote: target.idNote,
		}

		this.fullScreenMedia = new FullScreenMedia(this.element, data, this.onClickByFullScreenMedia.bind(this))
	}

	#removeFullScrenMedia() {
		this.fullScreenMedia.deleteElement()
		this.fullScreenMedia = 0;
	}

	onClickByFullScreenMedia(target) {
		switch(target.action) {
			case `remove`:
				this.main.removeFile(target.data)
				this.addDataToStream(`removeFile`, target.data.file)				
				break;
		}

		this.#removeFullScrenMedia()
	}

	#requestRemoveFile(data) {
		this.addDataToStream(`removeFile`, data)			
	}

	#requestRemoveNote(data) {
		this.addDataToStream(`removeNote`, data)			
	}

	#requestEditingNote(note) {
		this.main.renderEditingNote({
			note: note,
			tags: this.existTags,
		})
	}

	#requestSaveEditedNote(note) {
		this.addDataToStream(`saveEditedNote`, note);
	}

	#requestSaveCreatedNote(note) {
		this.addDataToStream(`saveCreatedNote`, note);
	}

	#enableFullPanelCreatingNote() {
		this.main.scrollButton.positiongElementOnPage();
		this.main.scrollButton.hideElement()
	
		if(this.main.noteList) {
			this.main.noteList.addOverlay()		
		}
	}

	#disableFullPanelCreatingNote() {
		this.main.scrollButton.positiongElementOnPage();
		
		if(!this.main.editingNote) {
			if(this.main.noteList) {
				this.main.noteList.removeOverlay();
			}

			this.main.scrollButton.showElement();
		}
	}

	updateLocalCreatedNoteOnSavedNode(note) {
		//получить ноут из локал сторадже пришла запись, есои ее айдиКреатед сопадает с айлди запис в ожидающих сохраения - сравнивается дата обновления. Если не свпадает - нужно обновить айдишки, после чего уже локальную версию добавть в лентук на смену и отправить на обновление this.feed.updateLocalCreatedNoteOnSavedNode(note)
		this.main.changeNote()
	}
}
