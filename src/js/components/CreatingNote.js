import BaseComponent from '../helpers/BaseComponent'
import MediaRecord from './MediaRecord';
import ContextMenuAddingTag from './popups/ContextMenuAddingTag';
import ModalGeolocation from './popups/ModalGeolocation';
import ModalRecordMedia from './popups/ModalRecordMedia';

import { Subject, fromEvent, debounceTime, throttleTime, filter, merge, map } from 'rxjs'

import { formatCoords } from '../helpers/validateAndFormatCoords';
import { createNoteStaticElements, general, fileLimits, knownTypes } from '../consts/index.js';

export default class CreatingNote extends BaseComponent {
	constructor(container, callbackForSave) {
		super(container);

		this.staticElements = {
			main: {
				container: null,
				text: null,
				send: null,
				geolocation: {
					container: null,
					icon: null,
				},
				addTag: null,
				recordVoice: null,
				recordVoiceDescription: null,
				recordVideo: null,
				recordVideoDescription: null,
				addFiles: null,
				addFilesDescription: null,
				addFilesInput: null,
				dropArea: null,
			},
			tags: { 
				container: null,
				list: null,
			},
			attachment: {
				container: null,
				error: null,
				inline: null,
				block: null,
			}
		}

		this.existTags = [];

		this.note = {
			attachment: {
				image: [],
				video: [],
				audio: [],
				other: [],
			},
			tags: [],
			geolocation: null,
		}

		this.geolocation = {
			enable: false,
			coords: null,
		}

		this.mediaRecord = null;

		this.contextMenu = null;
		this.modal = null;

		this.visibleFullPanelCreateNote = false;
		this.timers = {
			atachmentError: null,
		}

		this.#renderElement();
		this.#createStreams();
		this.#subscribeToStreams(callbackForSave);
		this.#loadNoteFromLocalStorage()
	}

	#renderElement(callbackForSave) {
		this.element = document.createElement(`div`);
		this.element.classList.add(`creatingNote`)
		this.element.dataset.id = `panelCreateNoteContainer`;

		this.#renderMainSection(); 	  
		this.#renderSectionTags();
		this.#renderSectionAttachment();

		this.#saveElementsMainSection();

		this.element.append(
			this.staticElements.main.container, 
			this.staticElements.tags.container, 
			this.staticElements.attachment.container, 
		);

		this.container.append(this.element);
	}

	#createStreams() {
		this.saveStream(`requestAction`, new Subject());
		
		const app = document.querySelector(`[data-app-id="${general.appId}"]`)
		const clicksOnApp = fromEvent(app, `click`).pipe(
			throttleTime(50)
		)
		this.saveStream(`clicksOnApp`, clicksOnApp);	

		const dropFilesOnPage = fromEvent(app, `drop`);
		this.saveStream(`dropFilesOnPage`, dropFilesOnPage);

		const focusOnTextField = fromEvent(this.staticElements.main.text, `focus`);
		this.saveStream(`focusOnTextField`, focusOnTextField);

		const blurFromTextField = fromEvent(this.staticElements.main.text, `blur`);
		this.saveStream(`blurFromTextField`, blurFromTextField);

		const inputTextCreatingNote = fromEvent(this.staticElements.main.text, `input`);
		this.saveStream(`inputTextCreatingNote`, inputTextCreatingNote);

		const pressEnterOnTextField = fromEvent(this.staticElements.main.text, `keypress`).pipe(
			filter(event => {
				if(event.key === 'Enter' && event.shiftKey === false) {
					return true;
				}
			})
		)
		this.saveStream(`pressEnterOnTextField`, pressEnterOnTextField);

		const pressEscOnTextField = fromEvent(this.staticElements.main.text, `keydown`).pipe(
			filter(event => {
				if(event.key === 'Escape') {
					return true;
				}
			})
		)
		this.saveStream(`pressEscOnTextField`, pressEscOnTextField);

		const filesEnterToPage = fromEvent(document, `dragenter`).pipe(
			filter(event => !event.relatedTarget)
		)
		this.saveStream(`filesEnterToPage`, filesEnterToPage)

		const filesLeaveFromApp = fromEvent(document, `dragleave`).pipe(
			filter(event => !event.relatedTarget)
		);;
		this.saveStream(`filesLeaveFromApp`, filesLeaveFromApp);

		this.saveStream(`filesEnterToDropArea`, fromEvent(this.staticElements.main.dropArea, `dragenter`));
		this.saveStream(`filesLeaveFromDropArea`, fromEvent(this.staticElements.main.dropArea, `dragleave`));

		app.addEventListener(`dragover`, event => {
			event.preventDefault()
		})
	
		const addingFiles = merge(
			fromEvent(this.staticElements.main.addFilesInput, `change`).pipe(
				map(event => event.target.files)
			),
			fromEvent(this.staticElements.main.dropArea, `drop`).pipe(
				map(event => {
					event.preventDefault();
					return	event.dataTransfer.files;
				})
			) 
		).pipe(
			filter(files => files.length > 0)
		)

		this.saveStream(`addingFiles`, addingFiles)
	}

	#subscribeToStreams(callbackForSave) {
		this.subscribeToStream(`requestAction`, callbackForSave);
		this.subscribeToStream(`clicksOnApp`, this.#onClickByAppElement.bind(this));
		this.subscribeToStream(`dropFilesOnPage`, this.#onDropFilesOnPage.bind(this));
		this.subscribeToStream(`focusOnTextField`,  this.#onFocusTextField.bind(this));
		this.subscribeToStream(`blurFromTextField`, this.#onBlurFromTextField.bind(this));
		this.subscribeToStream(`inputTextCreatingNote`, this.#onInputTextCreatingNote.bind(this));
		this.subscribeToStream(`pressEnterOnTextField`, this.#onPressEnterOnTextInput.bind(this));
		this.subscribeToStream(`pressEscOnTextField`, this.#onPressEscOnTextInput.bind(this));

		this.subscribeToStream(`filesEnterToPage`, this.#onFilesEnterToPage.bind(this)); 
		this.subscribeToStream(`filesEnterToDropArea`, this.#onFilesEnterToDropArea.bind(this)); 
		this.subscribeToStream(`filesLeaveFromDropArea`, this.#onFilesLeaveFromDropArea.bind(this));
		this.subscribeToStream(`filesLeaveFromApp`, this.#onFilesLeaveFromApp.bind(this)); 

		this.subscribeToStream(`addingFiles`, this.#onAddingNewFiles.bind(this));
	}

	#renderMainSection() {
		this.staticElements.main.container = document.createElement(`section`);
		this.staticElements.main.container.classList.add(`create-note__main-section`);
		this.staticElements.main.container.innerHTML = `
			<div class="create-note__text">
				<div contenteditable="true" class="create-note__text-body create-note__text-body_empty" data-id="newNoteText" data-target-action="inputText">
					${createNoteStaticElements.placeholder}
				</div>

				<div class="button-icon icon_active-size create-note__text-send hidden-item" data-id="newNoteSend" data-target-action="sendNote">
					<div class="create-note__text-send-icon ">
					</div>
				</div>
			</div>

			<div class="create-note__button create-note__geolocation hidden-item" data-id="newNoteGeolocation" data-geo="null" data-target-action="switchNoteGeolocation">
				<div class="create-note__button-text create-note__geolocation-text" data-geolocation-active="false">
					${createNoteStaticElements.buttons.geolocation}:
				</div>

				<div class="slider-button create-note__geolocation-icon" data-id="newNoteGeolocationIcon" data-active-geolocation="false">
					<div class="button-icon slider-button__switch create-note__geolocation-icon-switch">
					</div>
				</div>
			</div>

			<div class="create-note__button create-note__add-tag hidden-item" data-id="newNoteAddTag" data-target-action="openContextMenuAddingTag">
				<div class="create-note__button-text create-note__add-tag-text">
					${createNoteStaticElements.buttons.tag}
				</div>

				<div class="button-icon create-note__button-icon create-note__add-tag-icon">
				</div>
			</div>
							
			<div class="create-note__button create-note__start-record-voice" data-id="newNoteRecordVoice" data-target-action="recordVoice">
				<div class="create-note__button-text create-note__button-text_hide create-note__button-text create-note__button-adaptive-text hidden-item" data-id="newNoteRecordVoiceDescription">
					${createNoteStaticElements.buttons.voice}
				</div>
									
				<div class="button-icon create-note__button-icon create-note__start-record-voice-icon">
				</div>
			</div>
								
			<div class="create-note__button create-note__start-record-video" data-id="newNoteRecordVideo" data-target-action="recordVideo">
				<div class="create-note__button-text create-note__button-text_hide create-note__button-text create-note__button-adaptive-text hidden-item" data-id="newNoteRecordVideoDescription">
					${createNoteStaticElements.buttons.video}
				</div>
							
				<div class="button-icon create-note__button-icon create-note__start-record-video-icon">
				</div>
			</div>

			<label class="create-note__add-files create-note__button" for="create-note-add-files" data-id="newNoteAddFiles" data-target-action="addFiles">
				<input id="create-note-add-files" type="file" class="create-note__add-files-input  hidden-item" multiple="multiple" data-id="newNoteAddFilesInput">
				<div class="create-note__button-text create-note__button-text_hide create-note__add-files-text create-note__button-adaptive-text hidden-item" data-id="newNoteAddFilesDescription">
					${createNoteStaticElements.buttons.files}
				</div>
				<div class="button-icon create-note__button-icon create-note__add-files-icon">
				</div>
			</label>
			<div class="create-note__drop-area hidden-item" data-id="newNoteDropArea">
				<p class="create-note__drop-area-title">
					Drop files here
				</p>
			</div>
		`
	}

	#renderSectionTags() {
		this.staticElements.tags.container = document.createElement(`section`);
		this.staticElements.tags.container.classList.add(`create-note__added-tags`, `hidden-item`);

		this.staticElements.tags.list = document.createElement(`ul`);
		this.staticElements.tags.list.classList.add(`tags-row`, `create-note__added-tags-list`);

		this.staticElements.tags.container.append(this.staticElements.tags.list)
	}

	#renderSectionAttachment() {			
		this.staticElements.attachment.container = document.createElement(`section`);
		this.staticElements.attachment.container.classList.add(`create-note__attachment`, `create-note__attachment_hidden`);

		this.staticElements.attachment.error = document.createElement(`div`);
		this.staticElements.attachment.error.classList.add(`create-note__attachment-error`, `hidden-item`);
				
		this.staticElements.attachment.inline = document.createElement(`ul`);
		this.staticElements.attachment.inline.classList.add(`create-note__attachment-list`, `create-note__attachment-inline`, `hidden-item`);
			
		this.staticElements.attachment.block = document.createElement(`ul`);
		this.staticElements.attachment.block.classList.add(`create-note__attachment-list`, `create-note__attachment-block`, `hidden-item`);

		this.staticElements.attachment.container.append(
			this.staticElements.attachment.error,
			this.staticElements.attachment.inline,
			this.staticElements.attachment.block
		)
	}

	#saveElementsMainSection() {
		this.staticElements.main.text = this.staticElements.main.container.querySelector(`[data-id="newNoteText"]`);
		this.staticElements.main.send = this.staticElements.main.container.querySelector(`[data-id="newNoteSend"]`);
		this.staticElements.main.geolocation.container = this.staticElements.main.container.querySelector(`[data-id="newNoteGeolocation"]`)
		this.staticElements.main.geolocation.icon = this.staticElements.main.container.querySelector(`[data-id="newNoteGeolocationIcon"]`)
		this.staticElements.main.addTag = this.staticElements.main.container.querySelector(`[data-id="newNoteAddTag"]`);
		this.staticElements.main.recordVoice = this.staticElements.main.container.querySelector(`[data-id="newNoteRecordVoice"]`);
		this.staticElements.main.recordVoiceDescription = this.staticElements.main.container.querySelector(`[data-id="newNoteRecordVoiceDescription"]`)
		this.staticElements.main.recordVideo = this.staticElements.main.container.querySelector(`[data-id="newNoteRecordVideo"]`);
		this.staticElements.main.recordVideoDescription = this.staticElements.main.container.querySelector(`[data-id="newNoteRecordVideoDescription"]`)
		this.staticElements.main.addFiles = this.staticElements.main.container.querySelector(`[data-id="newNoteAddFiles"]`);
		this.staticElements.main.addFilesDescription = this.staticElements.main.container.querySelector(`[data-id="newNoteAddFilesDescription"]`)
		this.staticElements.main.addFilesInput = this.staticElements.main.container.querySelector(`[data-id="newNoteAddFilesInput"]`);			
		this.staticElements.main.dropArea = this.staticElements.main.container.querySelector(`[data-id="newNoteDropArea"]`);
	}
			
	#createTagElement(tag) {
		if(!tag) {
			console.log(`empty element`);
			return;
		}

		const tagElement = document.createElement(`li`);
		tagElement.classList.add(`tag-inline`, `create-note__added-tag`);
		tagElement.dataset.tagId = tag.id;
		tagElement.dataset.name = `creatingNoteTag`
		tagElement.innerHTML = `
			<span class="tag-inline__section tag-inline__title">
				${tag.title}
			</span>

			<div class="button-icon tag-inline__section tag-inline__options figure-button create-note__added-tag-remove" data-tag="${tag.id}" data-name="newNoteTagRemove" data-target-action="removeTag">
				<div class="figure-button__item figure-button__cross create-note__added-tag-remove-cross">
				</div>
			</div>
		`
		return tagElement;
	}

	#createAttachmenElement(file) {
		if(!file) {
			console.log(`empty element`);
			return;
		}

		const style = file.type === `image` || file.type === `video` ?
			`inline` :
			`block`

		const attachmentElement = document.createElement(`li`);
		attachmentElement.classList.add(`create-note__attachment-${style}-item`);
		attachmentElement.dataset.id = file.id;

		switch (file.type) {
			case `image`:
				attachmentElement.innerHTML = `
					<img src="${file.blobUrl}" class="create-note__attachment-inline-file" alt="${file.name}">
					</img>
				`
				break;

			case `video`:
				attachmentElement.innerHTML = `
					<video src="${file.blobUrl}" class="create-note__attachment-inline-file feed-note-video__file" data-target-action="pauseVideoPreview"  data-file-id="${file.id}">
					</video>
					<div class="create-note__attachment-video-play" data-target-action="playVideoPreview" data-file-id="${file.id}">
						<div class="create-note__attachment-video-play-icon">
						</div>
					</div>
				`
				break;

			case `audio`:
				attachmentElement.innerHTML = `
					<audio src="${file.blobUrl}" class="create-note__attachment-block-file" controls="controls">
					</audio>
				`
				break;

			default:
				attachmentElement.classList.add(`feed-content-other-file`)
				attachmentElement.innerHTML = `
					<a href="${file.blobUrl}" class="feed-content-other-file__link create-note__attachment-block-file" onclick="event.preventDefault()">
						${file.name}
					</a>
				`
		}

		attachmentElement.innerHTML += `
			<div class="button-icon figure-button create-note__attachment-${style}-remove" data-file-id="${file.id}" data-target-action="removeAttachment" data-style-attachment="${style}" data-type-attachment="${file.type}">
				<div class="figure-button__item figure-button__cross create-note__attachment-${style}-remove-cross">
				</div>
			</div>
		`
		return attachmentElement;			
	}

	#enableFullPanelCreateNote() {
		this.staticElements.main.container.classList.add(`create-note_active`);

		this.staticElements.main.geolocation.container.classList.remove(`hidden-item`);
		this.staticElements.main.addTag.classList.remove(`hidden-item`);

		this.staticElements.main.recordVoiceDescription.classList.remove(`hidden-item`);
		this.staticElements.main.recordVideoDescription.classList.remove(`hidden-item`);
		this.staticElements.main.addFilesDescription.classList.remove(`hidden-item`);
		this.visibleFullPanelCreateNote = true;		

		this.addDataToStream(`requestAction`, {
			action: `enableFullPanelCreatingNote`
		})

		if(this.note.tags.length > 0) {
			this.#showSectionTags()
		}
		
		this.#showSectionAttachment()
	}


	#disableFullPanelCreateNote() {
		this.staticElements.main.container.classList.remove(`create-note_active`);

		this.staticElements.main.geolocation.container.classList.add(`hidden-item`);
		this.staticElements.main.addTag.classList.add(`hidden-item`);

		this.staticElements.main.recordVoiceDescription.classList.add(`hidden-item`);
		this.staticElements.main.recordVideoDescription.classList.add(`hidden-item`);
		this.staticElements.main.addFilesDescription.classList.add(`hidden-item`);

		this.visibleFullPanelCreateNote = false;		

		this.addDataToStream(`requestAction`, {
			action: `disableFullPanelCreatingNote`
		})

		this.#hideSectionTags()
		this.#hideSectionAttachment()
	}

	#switchNoteGeolocation() {
		this.geolocation.enable === true ?
			this.#disableNoteGeolocation() :
			this.#createModalGeolocation()
	}

	#createModalGeolocation() {
		if(this.modal) {
			this.modal.deleteElement();
			this.modal = null;
		}
	
		this.modal = new ModalGeolocation(this.#onClickByModalGeolocation.bind(this));

		if(this.geolocation.coords) {
			this.modal.updateCoordsInput(this.geolocation.coords);	
			this.modal.setDescriptionConfirmGeolocation();
		
		} else {
			this.modal.setDescriptionInputGeolocation();
			
			if(navigator.geolocation) {	
				navigator.geolocation.getCurrentPosition(this.#onPermissionGeolocation.bind(this), this.#onErrorGeolocation.bind(this))
				navigator.geolocation.watchPosition(this.#onUpdateGeolocationFromNavigator.bind(this), this.#onErrorGeolocation.bind(this))	
			}
		}
	} 

	#createModalRecord(data) {
		if(this.modal) {
			this.modal.deleteElement();
			this.modal = null;
		}

		switch(data.type) {
			case `errorRecord`:
				this.modal = new ModalRecordMedia(this.#onClickByModalRecordError.bind(this), data)
				break;

			case `cantSaveMedia`:
				this.modal = new ModalRecordMedia(this.#onClickByModalRecordCantSaveMedia.bind(this), data)
				break;
		}
	}

	#removeModal() {
		if(this.modal) {
			this.modal.deleteElement();
			this.modal = null;
		}
	}

	#enableNoteGeolocation(coords) {
		this.geolocation.enable = true;	
		this.note.geolocation = formatCoords(coords)
		this.staticElements.main.geolocation.container.dataset.geolocationActive = true
		this.staticElements.main.geolocation.icon.classList.add(`slider-button_active`)
	}

	#disableNoteGeolocation() {
		this.geolocation.enable = false;
		this.note.geolocation = null;
		this.staticElements.main.geolocation.container.dataset.geolocationActive = false
		this.staticElements.main.geolocation.icon.classList.remove(`slider-button_active`)
	}

	updateExistTags(tags) {
		this.existTags = tags;
	}

	#createContextMenuAddingTag() {
		if(this.contextMenu) {
			this.contextMenu.deleteElement();
			this.contextMenu = null;
		}

		const tags = {
			exist: this.existTags,
			note: this.note.tags,
		}

		const feed = document.querySelector(`[data-id="appFeed"]`);

		this.contextMenu = new ContextMenuAddingTag(
			feed, 
			this.staticElements.main.addTag, 
			this.#onRequestActionFromContextMenuAddingTag.bind(this),
			tags
		)

		this.addOverlay();
		this.disableScrolling();

		this.contextMenu.addElementToPage();
		this.contextMenu.positiongOnPage();
	
	}

	#removeContextMenu() {
		if(this.contextMenu) {
			this.contextMenu.deleteElement();		
		}

		this.contextMenu = null;
		this.removeOverlay();
		this.enableScrolling();
	}

	#chekingFileForAddToNote(file, type) {
		const response = {
			success: false,
		}
		
		const fileCurrentTypeConst = fileLimits.find(item => item.TYPE === type);
		const noteCurrentAttachment = this.note.attachment[type];

		if(noteCurrentAttachment.length >= fileCurrentTypeConst.MAX_COUNT) {
			response.error = `exceededLimit`;
			return response;
		}

		const limitSize = fileCurrentTypeConst.MAX_SIZE_MB * 1024 * 1024

		if(file.size > limitSize) {
			response.error = `bigSize`;
			return response;			
		}

		response.success = true;
		return response;
	}

	#addTagToNote(tag) {
		if(tag.new === true) {
			tag.id = `${Date.now()}${this.note.tags.length}`;
		}
		
		const tagElement = this.#createTagElement(tag);
		this.staticElements.tags.list.append(tagElement);
		this.note.tags.push(tag);

		this.#showSectionTags();
	}

	#removeTagFromNote(target) {
		const targetTagElement = target.closest(`[data-name="creatingNoteTag"]`);
		
		if(!targetTagElement) {
			return
		}

		const targetTagId = targetTagElement.dataset.tagId;
		const indexTargetTag = this.note.tags.findIndex(item => item.id === targetTagId);

		if(indexTargetTag >= 0) {
			this.note.tags.splice(indexTargetTag, 1);

		}

		targetTagElement.remove();

		if(this.note.tags.length === 0) {
			this.#hideSectionTags()
		}
	}
	
	#addAttachmentError(error) {
		if(this.timers.atachmentError) {
			clearTimeout(this.timers.atachmentError)
		}

		this.staticElements.attachment.error.classList.remove(`hidden-item`);
		this.staticElements.attachment.error.textContent = error;
		this.staticElements.attachment.error.scrollIntoView({
			block: "center",
			behavior: "smooth" 
		})

		this.timers.atachmentError = setTimeout(() => this.#deleteAttachmentError(), 5000)
	}

	#deleteAttachmentError() {
		this.staticElements.attachment.error.classList.add(`hidden-item`);
		this.staticElements.attachment.error.textContent = ``
	}

	#addAttachmentToNote(attachment) {
		const fileData = {
			id: attachment.id,
			blobUrl: attachment.blobUrl,
			type: attachment.type,
			name: attachment.file.name,
		}

		attachment.type === `image` || attachment.type === `video` ?
			this.#addInlineFileToPage(fileData) :
			this.#addBlockFileToPage(fileData)

		this.#enableFullPanelCreateNote()
	}

	#addInlineFileToPage(fileData) {
		const fileElement = this.#createAttachmenElement(fileData);
		this.staticElements.attachment.inline.append(fileElement);
		this.#showSectionInlineAttachment();
	}

	#addBlockFileToPage(fileData) {
		const fileElement = this.#createAttachmenElement(fileData);		
		this.staticElements.attachment.block.append(fileElement);
		this.#showSectionBlockAttachment();		
	}

	#playVideoPreview(target) {
		const videoContainer = target.closest(`li`);
		const videoElement = videoContainer.querySelector(`video`);

		videoElement.onended = (event) => this.#onPauseVideo(event.target);
		videoElement.onpause = (event) => this.#onPauseVideo(event.target);
		videoElement.play().
			then(() => {
				target.classList.add('hidden-item')
			}).
			catch(err => {
				console.log(`Не удалось запустить видео: ${err}`);
		})
	}

	#pauseVideoPreview(target) {
		if(target.paused) {
			return;
		}

		target.pause();
		this.#onPauseVideo(target)
	}

	#onPauseVideo(target) {
		const videoContainer = target.closest(`li`);
		const videoPlayButton = videoContainer.querySelector(`[data-target-action="playVideoPreview"]`);
		videoPlayButton.classList.remove('hidden-item')
	}

	#removeAttachment(target) {
		target.dataset.styleAttachment === `inline` ?
			this.#removeInlineAttachmentFromPage(target) :
			this.#removeBlockAttachmentFromPage(target)

		const { fileId, typeAttachment } = target.dataset;
		const targetAttachments = this.note.attachment[typeAttachment];
		const targetFile = targetAttachments.find(item => item.id === fileId);

		URL.revokeObjectURL(targetFile.blobUrl);

		const idTargetFile = targetAttachments.indexOf(targetFile);
		targetAttachments.splice(idTargetFile, 1)

		const textCreatingNote = String(this.staticElements.main.text.textContent.trim())
		if(textCreatingNote.length < 3 && this.note.attachment.image.length === 0 && this.note.attachment.video.length === 0 && this.note.attachment.audio.length === 0 && this.note.attachment.other.length === 0)	{
			this.#hideSendNoteButton();
		}		
	}

	#removeInlineAttachmentFromPage(target) {
		const containerAttachment = target.closest('li');
		containerAttachment.remove()

		if(!this.staticElements.attachment.inline.querySelector('li')) {
			this.#hideSectionInlineAttachment()
		}
	}

	#removeBlockAttachmentFromPage(target) {
		const containerAttachment = target.closest('li');
		containerAttachment.remove()

		if(!this.staticElements.attachment.block.querySelector('li')) {
			this.#hideSectionBlockAttachment()
		}
	}

	#saveRecordedMedia(file) {
		const typeFromRecordedFile = file.type.split('/')[0];
		const type = knownTypes.includes(typeFromRecordedFile) ?
				typeFromRecordedFile :
				`other`

		const isCanFileAddToNote = this.#chekingFileForAddToNote(file, type);
		const blobUrl = URL.createObjectURL(file);

		if(!isCanFileAddToNote.success) {
			this.#createModalRecord({
				type: `cantSaveMedia`,
				error: isCanFileAddToNote.error,
				file: {
					blobUrl,
					file,
					type
				}
			}) 
			return;
		}
			
		const newAttachment = {
			id: `${Date.now()}-${this.note.attachment[type].length}`,
			type,
			blobUrl,
			file,
		}

		this.note.attachment[type].push(newAttachment);
		this.#showSendNoteButton();
		this.#addAttachmentToNote(newAttachment);
	}



	#showSectionTags() {
		this.staticElements.tags.container.classList.remove(`hidden-item`);
	}

	#hideSectionTags() {
		this.staticElements.tags.container.classList.add(`hidden-item`);
	}

	#showDropArea() {
		this.staticElements.main.dropArea.classList.remove(`hidden-item`);
	}

	#hideDropArea() {
		this.#deActiveDropArea()
		this.staticElements.main.dropArea.classList.add(`hidden-item`);
	}

	#activeDropArea() {
		this.staticElements.main.dropArea.classList.add(`create-note__drop-area_active`)
	}

	#deActiveDropArea() {
		this.staticElements.main.dropArea.classList.remove(`create-note__drop-area_active`)
	}

	#showSectionInlineAttachment() {
		this.staticElements.attachment.inline.classList.remove(`hidden-item`);
	}

	#hideSectionInlineAttachment() {
		this.staticElements.attachment.inline.classList.add(`hidden-item`);
	}

	#showSectionBlockAttachment() {
		this.staticElements.attachment.block.classList.remove(`hidden-item`);
	}

	#hideSectionBlockAttachment() {
		this.staticElements.attachment.block.classList.add(`hidden-item`);
	}
	
	#showSectionAttachment() {	
		if(this.staticElements.attachment.inline.querySelector(`li`)) {
			this.#showSectionInlineAttachment();
		}

		if(this.staticElements.attachment.block.querySelector(`li`)) {
			this.#showSectionBlockAttachment();
		}

		this.staticElements.attachment.container.classList.remove(`create-note__attachment_hidden`);
	}

	#hideSectionAttachment() {
		this.#hideSectionInlineAttachment();
		this.#hideSectionBlockAttachment();
	
		this.staticElements.attachment.container.classList.add(`create-note__attachment_hidden`);
	}

	#showSendNoteButton() {
		this.staticElements.main.send.classList.remove('hidden-item');
	}

	#hideSendNoteButton() {
		this.staticElements.main.send.classList.add('hidden-item');
	}

	#onPermissionGeolocation(event) {
		const { latitude, longitude } = event.coords;
		this.geolocation.coords = [latitude, longitude]

		this.modal.setInitCoordsFromNavigator(this.geolocation.coords);
		this.modal.setDescriptionConfirmGeolocation();
	}

	#onUpdateGeolocationFromNavigator(event) {
		const { latitude, longitude } = event.coords;
		this.geolocation.coords = [latitude, longitude]
	}

	#onErrorGeolocation(event) {
		this.geolocation.coords = null;
	}

	#onFilesEnterToPage(event) {
		if(this.contextMenu) {
			this.contextMenu.deleteElement();
		}
		this.#showDropArea() 
	}

	#onFilesEnterToDropArea(event) {	
		this.#activeDropArea() 
	}

	#onFilesLeaveFromDropArea(event) {
		this.#deActiveDropArea()
	}

	#onFilesLeaveFromApp(event) {
		this.#hideDropArea() 
	}

	#onDropFilesOnPage() {
		this.#hideDropArea();
	}

	#onAddingNewFiles(files) {
		// this.#hideDropArea();
		this.#deleteAttachmentError();

		const filesArray = Array.from(files)

		filesArray.forEach(file => {
			const typeFromLoadedFile = file.type.split('/')[0];
			const type = knownTypes.includes(typeFromLoadedFile) ?
				typeFromLoadedFile :
				`other`

			const isCanFileAddToNote = this.#chekingFileForAddToNote(file, type);

			if(!isCanFileAddToNote.success) {
				switch (isCanFileAddToNote.error) {
					case `bigSize`:
						this.#addAttachmentError(`Слишком большой размер файла: ${file.name}`)
						break;

					case `exceededLimit`:
						this.#addAttachmentError(`Слишком много файлов`);
						break
				}
				return;
			}

			const newAttachment = {
				id: `${Date.now()}-${this.note.attachment[type].length}`,
				blobUrl: URL.createObjectURL(file),
				type,
				file,
			}

			this.note.attachment[type].push(newAttachment);
			this.#showSendNoteButton();
			this.#addAttachmentToNote(newAttachment);
		})
	}

	#onFocusTextField() {
		if(this.staticElements.main.text.textContent.trim() === createNoteStaticElements.placeholder) {
			this.staticElements.main.text.textContent = ``;
		}
	}

	#onBlurFromTextField() {
		if(this.staticElements.main.text.textContent.trim() === ``) {
			this.staticElements.main.text.textContent = createNoteStaticElements.placeholder
		}

		this.saveNoteToLocalStorage();
	}

	#onInputTextCreatingNote(event) {
		const textCreatingNote = String(this.staticElements.main.text.textContent.trim())

		if(textCreatingNote.length > 2) {
			this.#showSendNoteButton();

		} else if(this.note.attachment.image.length === 0 && this.note.attachment.video.length === 0 && this.note.attachment.audio.length === 0 && this.note.attachment.other.length === 0)	{
			this.#hideSendNoteButton();
		}		
	}

	#onPressEscOnTextInput(event) {
		this.staticElements.main.text.blur()
		this.container.dispatchEvent(new MouseEvent(`click`, {
			bubbles: true,
		}))
	}

	#onPressEnterOnTextInput(event) {
		event.preventDefault()
		this.staticElements.main.send.dispatchEvent(new MouseEvent(`click`, {
			bubbles: true,
		}))
	}

	#onClickByAppElement(event) {
		event.stopPropagation()
		if(this.contextMenu || this.modal || this.mediaRecord) {
			return;
		}

		if(!event.target.closest(`[data-id="panelCreateNoteContainer"]`)) {
			if(this.visibleFullPanelCreateNote) {
				this.#disableFullPanelCreateNote();
			}
			return;
		}

		const targetElement = event.target.closest(`[data-target-action]`);
		if(!targetElement) {
			return;
		}

		switch(targetElement.dataset.targetAction) {
			case `inputText`:
				this.#enableFullPanelCreateNote();
				break;

			case `sendNote`:
				this.#sendNote()
				break;
				
			case `switchNoteGeolocation`:
				this.#switchNoteGeolocation()
				break;
				
			case `openContextMenuAddingTag`:
				this.#createContextMenuAddingTag()
				break;

			case `recordVoice`:
				this.#recordVoice()
				break;
				
			case `recordVideo`:
				this.#recordVideo()
				break;
			
			case `playVideoPreview`:
				this.#playVideoPreview(targetElement)
				break;

			case `pauseVideoPreview`:
				this.#pauseVideoPreview(targetElement)
				break;
				
			case `removeAttachment`:
				this.#removeAttachment(targetElement)
				break;
			
			case `removeTag`:
				this.#removeTagFromNote(targetElement)
				break;
	
		}			
	}

	#onClickByModalGeolocation(event) {
		if(!event.target.closest(`[data-id="modalGeolocationBody"]`)) {
			this.#removeModal();
			return;
		}

		const targetActionElement = event.target.closest(`[data-target-action]`);
		if(!targetActionElement) {
			return;
		}
	
		const targetAction = targetActionElement.dataset.targetAction;
		switch(targetAction) {
			case `closeModal`:
				this.#removeModal();
				break;

			case `saveCoords`:
				if(targetActionElement.dataset.active === `false`) {
					return;
				}
				this.#enableNoteGeolocation(this.modal.coords);
				this.#removeModal();
				break;
		}
	}

	#onClickByModalRecordError(event) {
		if(!event.target.closest(`[data-id="modalRecordMediaErrorBody"]`)) {
			this.#removeModal();
			return;
		}

		if(event.target.closest(`[data-target-action="closeModalRecordMedia"]`)) {
			this.#removeModal();
			return;
		}
	}

	#onClickByModalRecordCantSaveMedia(event) {
		const targetElement = event.target.closest(`[data-target-action]`);
		if(!targetElement) return;

		const targetAction = targetElement.dataset.targetAction;
		if(!targetAction) return;

		switch(targetAction) {
			case `removeRecordedMedia`:
				this.#removeModal();
				break;

			case `downloadRecordedMedia`:
				this.#downloadRecordedMedia(targetElement.dataset);
				this.#removeModal();
				break;
			}
	}

	#downloadRecordedMedia(data) {
		const tempElement = document.createElement(`a`);
		tempElement.setAttribute(`href`, data.fileUrl);
		tempElement.setAttribute(`download`, data.fileName)

		this.element.append(tempElement)
		
		tempElement.click()
		tempElement.remove()
	}

	#onRequestActionFromContextMenuAddingTag(data) {
		switch(data.action) {
			case `closeContextMenu`:
				this.#removeContextMenu()
				break;

			case `addTagToNote`:
				this.#addTagToNote(data.tag);
				this.#removeContextMenu();	
				break;
		}
	}

	#onResponseFromMediaRecord(response) {
		switch (response.action) {
			case `errorRecord`:
				this.#onErrorRecordMedia(response.error);
				this.#removeMediaRecord();
				break;

			case `cancelRecord`:
				this.#removeMediaRecord();
				break;

			case `saveMedia`:
				this.#saveRecordedMedia(response.media);
				this.#removeMediaRecord();
				break;
		}
	}

	#onErrorRecordMedia(error) {
		this.#createModalRecord({
			type: `errorRecord`,
			error: error.name,
		});
	}

	getDataFromCreatingNote() {
		const creatingNoteData = {
			text: this.staticElements.main.text.innerHTML.trim()
		}

		return creatingNoteData;
	}

	setDataToCreatingNote(data) {
		if(!data) {
			return;
		}

		if(data.text.length > 2 && data.text !==createNoteStaticElements.placeholder) {
			this.#showSendNoteButton();
		}

		this.staticElements.main.text.innerHTML = data.text;
	}

	saveNoteToLocalStorage() {
		const creatingNoteData = this.getDataFromCreatingNote();
		
		if(!creatingNoteData) {
			return
		}

		const creatingNoteDataJSON = JSON.stringify(creatingNoteData);
		localStorage.setItem(`creatingNote`, creatingNoteDataJSON)
	}
	
	#loadNoteFromLocalStorage() {
		const loadedCreatingNoteDataJSON = localStorage.getItem(`creatingNote`);

		if(!loadedCreatingNoteDataJSON) {
			return
		}		

		const loadedCreatingNoteData = JSON.parse(loadedCreatingNoteDataJSON);
		this.setDataToCreatingNote(loadedCreatingNoteData)
	}
	
	clearNoteOnLocalStorage() {
		localStorage.removeItem(`creatingNote`)
	}

	#recordVoice() {
		this.#createMediaRecord(`audio`)
	}

	#recordVideo() {
		this.#createMediaRecord(`video`)
	}

	#createMediaRecord(type) {
		if (!navigator.mediaDevices) {
			this.#createModalRecord({
				type: `errorRecord`,
				error: `UnknownError`,
			})
			return;
		}
	
		if(this.mediaRecord) {
			this.#removeMediaRecord()
		}

		const app = document.querySelector(`[data-app-id="${general.appId}"]`)

		this.mediaRecord = new MediaRecord(app, type, this.#onResponseFromMediaRecord.bind(this))	
	}

	#removeMediaRecord() {
		this.mediaRecord.deleteElement();
		this.mediaRecord = null;
	}

	#sendNote() {
		const randomNumb = Math.floor(Math.random() * 100)
		const note = {
			id: `${Date.now()}-${randomNumb}`,
			saved: false, 
			text: this.staticElements.main.text.innerHTML.trim(),
			tags: this.note.tags,
			geolocation: this.note.geolocation,
			attachment: this.note.attachment,
			dates: {
				created: Date.now(),
				edited: null,
			}
		}


		this.addDataToStream(`requestAction`, {
			action: `saveCreatedNote`,
			note,
		})

	}

	clearDataCreatingNote() {
		for(let key in this.note.attachment) {
			this.note.attachment[key] = []
		} 

		this.staticElements.attachment.error.textContent = ``;
		this.staticElements.attachment.inline.textContent = ``;
		this.staticElements.attachment.block.textContent = ``;
		this.staticElements.tags.textContent = ``;

		this.#hideSectionInlineAttachment();
		this.#hideSectionBlockAttachment();
		this.#hideSectionTags();
		this.#hideSendNoteButton();

		this.note.tags = [];

		this.staticElements.main.text.textContent = ``
		this.staticElements.main.text.dispatchEvent(new MouseEvent(`blur`));

		this.#disableFullPanelCreateNote()
	}

	clearBlobsLinksAttacment() {
		for(let key in this.note.attachment) {
			this.note.attachment[key].forEach(item => {
				URL.revokeObjectURL(item.blobUrl)
			})
		}
	}
}