import BaseComponent from '../helpers/BaseComponent'
import ContextMenu from './popups/ContextMenu';
import Modal from './popups/Modal';

import { createNoteStaticElements } from '../consts/index.js';

export default class CreatingNote extends BaseComponent {
	constructor(container) {
		super(container);

		this.staticElements = {
			sectionNote: null,	
			sectionTags: null,
			sectionAttachmentInline: null,
			sectionAttachmentBlock: null,
			noteText: null,
			noteSending: null,
			noteGeolocation: null,
			noteAddTag: null,
			noteRecordVoice: null,
			noteRecordVoiceDescription: null,
			noteRecordVideo: null,
			noteRecordVideoDescription: null,
			noteAddFiles: null,
			noteAddFilesDescription: null,
			noteAddFilesInput: null,
		}
	}

	initionRender() {
		this.#renderSectionNote();
		this.#renderSectionTags();
	  this.#renderSectionAttachmentInline();
 	  this.#renderSectionAttachmentBlock();
 	  this.#saveStaticElements();

 	  this.container.append(
 	  	this.staticElements.sectionNote, 
 	  	this.staticElements.sectionTags, 
 	  	this.staticElements.sectionAttachmentInline, 
 	  	this.staticElements.sectionAttachmentBlock
 	  );
	}

	#renderSectionNote() {
		this.staticElements.sectionNote = document.createElement(`section`);
		this.staticElements.sectionNote.classList.add(`create-note__main-section`);
		this.staticElements.sectionNote.innerHTML = `
			<div class="create-note__text">
				<div contenteditable="true" class="create-note__text-body create-note__text-body_empty" data-id="newNoteText">
					${createNoteStaticElements.placeholder}
				</div>

				<div class="button-icon icon_active-size create-note__text-send hidden-item" data-id="newNoteSend">
					<div class="create-note__text-send-icon ">
					</div>
				</div>
			</div>

			<div class="create-note__button create-note__geolocation hidden-item" data-id="newNoteGeolocation" data-geo="null">
				<div class="create-note__button-text create-note__geolocation-text">
					${createNoteStaticElements.buttons.geolocation}:
				</div>

				<div class="slider-button slider-button_active create-note__geolocation-icon" data-id="newNoteGeolocationIcon">
					<div class="button-icon slider-button__switch create-note__geolocation-icon-switch">
					</div>
				</div>
			</div>

			<div class="create-note__button create-note__add-tag hidden-item" data-id="newNoteAddTag">
				<div class="create-note__button-text create-note__add-tag-text">
					${createNoteStaticElements.buttons.tag}
				</div>

				<div class="button-icon create-note__button-icon create-note__add-tag-icon">
				</div>
			</div>
							
			<div class="create-note__button create-note__start-record-voice" data-id="newNoteRecordVoice">
				<div class="create-note__button-text create-note__button-text_hide create-note__button-text create-note__button-adaptive-text hidden-item" data-id="newNoteRecordVoiceDescription">
					${createNoteStaticElements.buttons.voice}
				</div>
									
				<div class="button-icon create-note__button-icon create-note__start-record-voice-icon">
				</div>
			</div>
								
			<div class="create-note__button create-note__start-record-video" data-id="newNoteRecordVideo">
				<div class="create-note__button-text create-note__button-text_hide create-note__button-text create-note__button-adaptive-text hidden-item" data-id="newNoteRecordVideoDescription">
					${createNoteStaticElements.buttons.video}
				</div>
							
				<div class="button-icon create-note__button-icon create-note__start-record-video-icon">
				</div>
			</div>

			<label class="create-note__add-files create-note__button" for="create-note-add-files"data-id="newNoteAddFiles">
				<input id="create-note-add-files" type="file" class="create-note__add-files-input  hidden-item" multiple="multiple" data-id="newNoteAddFilesInput">
								
				<div class="create-note__button-text create-note__button-text_hide create-note__add-files-text create-note__button-adaptive-text hidden-item" data-id="newNoteAddFilesDescription">
					${createNoteStaticElements.buttons.files}
				</div>
								
				<div class="button-icon create-note__button-icon create-note__add-files-icon">
				</div>
			</label>
		`
	}

	#renderSectionTags() {
		this.staticElements.sectionTags = document.createElement(`section`);
		this.staticElements.sectionTags.classList.add(`create-note__added-tags`, `hidden-item`);
		this.staticElements.sectionTags.innerHTML = `
			<ul class="tags-row create-note__added-tags-list">
			</ul>
		`
	}

	#renderSectionAttachmentInline() {
		this.staticElements.sectionAttachmentInline = document.createElement(`section`);
		this.staticElements.sectionAttachmentInline.classList.add(`create-note__attachment`, `create-note__attachment-inline`, `hidden-item`);
		this.staticElements.sectionAttachmentInline.innerHTML = `
			<div class="figure-button create-note__attachment-button create-note__attachment-button-left" data-id="createNoteAttachmentInlineLeft">
				<div class="figure-button__item figure-button__arrow figure-button__arrow-left create-note__attachment-arrow">
				</div>
			</div>

			<ul class="create-note__attachment-list create-note__attachment-inline-list">
			</ul>	

			<div class="figure-button create-note__attachment-button create-note__attachment-button-right" data-id="createNoteAttachmentInlineRight">
				<div class="figure-button__item figure-button__arrow figure-button__arrow-right create-note__attachment-arrow">
				</div>
			</div>
			`
		}

	#renderSectionAttachmentBlock() {
		this.staticElements.sectionAttachmentBlock = document.createElement(`section`);
		this.staticElements.sectionAttachmentBlock.classList.add(`create-note__attachment`, `create-note__attachment-block`, `hidden-item`);
		this.staticElements.sectionAttachmentBlock.innerHTML = `
			<ul class="create-note__attachment-list create-note__attachment-block-list">
			</ul>
		`
	}

	#saveStaticElements() {
		this.staticElements.noteText = this.staticElements.sectionNote.querySelector(`[data-id="newNoteText"]`);
		this.staticElements.noteSending = this.staticElements.sectionNote.querySelector(`[data-id="newNoteSend"]`);
		this.staticElements.noteGeolocation = this.staticElements.sectionNote.querySelector(`[data-id="newNoteGeolocation"]`)
		this.staticElements.noteAddTag = this.staticElements.sectionNote.querySelector(`[data-id="newNoteAddTag"]`);
		this.staticElements.noteRecordVoice = this.staticElements.sectionNote.querySelector(`[data-id="newNoteRecordVoice"]`);
		this.staticElements.noteRecordVoiceDescription = this.staticElements.sectionNote.querySelector(`[data-id="newNoteRecordVoiceDescription"]`)
		this.staticElements.noteRecordVideo = this.staticElements.sectionNote.querySelector(`[data-id="newNoteRecordVideo"]`);
		this.staticElements.noteRecordVideoDescription = this.staticElements.sectionNote.querySelector(`[data-id="newNoteRecordVideoDescription"]`)
		this.staticElements.noteAddFiles = this.staticElements.sectionNote.querySelector(`[data-id="newNoteAddFiles"]`);
		this.staticElements.noteAddFilesDescription = this.staticElements.sectionNote.querySelector(`[data-id="newNoteAddFilesDescription"]`)
		this.staticElements.noteAddFilesInput = this.staticElements.sectionNote.querySelector(`[data-id="newNoteAddFilesInput"]`);						
	}
			
	#createInlineTagElement(tag) {
		if(!tag) {
			console.log(`empty element`);
			return;
		}

		const tagElement = document.createElement(`li`);
		tagElement.classList.add(`tag-inline`, `create-note__added-tag`);
		tagElement.dataset.tag = tag.id;
		tagElement.innerHTML = `
			<span class="tag-inline__section tag-inline__title">
				${tag.title}
			</span>

			<div class="button-icon tag-inline__section tag-inline__options figure-button create-note__added-tag-remove" data-tag="${tag.id}" data-name="newNoteTagRemove">
				<div class="figure-button__item figure-button__cross create-note__added-tag-remove-cross">
				</div>
			</div>
		`
		return tagElement;
	}

	#createAttachmenError(error) {
		if(!error) {
			console.log(`empty element`);
			return;
		}

		const errorElement = document.createElement(`div`);
		errorElement.classList.add(`create-note__attachment-error`);
		errorElement.innerHTML = `
			<h2 class="create-note__attachment-error-title">
				${error.title}
			</h2>	

			<div class="create-note__attachment-error-description">
				${error.description}
			</div>
		`
		return errorElement				
	}						


	#createAttachmenElement(file) {
		if(!file) {
			console.log(`empty element`);
			return;
		}

		const attachmentElement = document.createElement(`li`);
		attachmentElement.classList.add(`create-note__attachment-${file.type}-item`);
		attachmentElement.dataset.id = file.id;

		switch (file.mime) {
			case `img`:
				attachmentElement.innerHTML = `
					<img src="${file.src}" class="create-note__attachment-inline-file" alt="${file.name}">
					</img>
				`
				break;

			case `video`:
				attachmentElement.innerHTML = `
					<video src="${file.src}" class="create-note__attachment-inline-file feed-note-video__file">
					</video>
				`
				break;

			case `audio`:
				attachmentElement.innerHTML = `
					<audio src="${file.src}" class="create-note__attachment-block-file" controls="controls">
					</audio>
				`
				break;

			default:
				attachmentElement.innerHTML = `
					<a href="${file.src}" class="feed-content-other-file create-note__attachment-block-file">
						${file.name}
					</a>
				`
		}
						
		attachmentElement.innerHTML += `
			<div class="button-icon figure-button create-note__attachment-${file.type}-remove" data-id="${file.id}">
				<div class="figure-button__item figure-button__cross create-note__attachment-${file.type}-remove-cross">
				</div>
			</div>
		`
		return attachmentElement;			
	}

	#enableFullPanelCreateNote() {
  	this.staticElements.sectionNote.classList.add(`create-note_active`);

  	this.staticElements.noteGeolocation.classList.remove(`hidden-item`);
  	this.staticElements.noteAddTag.classList.remove(`hidden-item`);

		this.staticElements.noteRecordVoiceDescription.classList.remove(`hidden-item`);
		this.staticElements.noteRecordVideoDescription.classList.remove(`hidden-item`);
		this.staticElements.noteAddFilesDescription.classList.remove(`hidden-item`);
	}

	#disableFullPanelCreateNote() {
  	this.staticElements.sectionNote.classList.remove(`create-note_active`);

  	this.staticElements.noteGeolocation.classList.add(`hidden-item`);
  	this.staticElements.noteAddTag.classList.add(`hidden-item`);

		this.staticElements.noteRecordVoiceDescription.classList.add(`hidden-item`);
		this.staticElements.noteRecordVideoDescription.classList.add(`hidden-item`);
		this.staticElements.noteAddFilesDescription.classList.add(`hidden-item`);
	}

	#addAttachmentError(error, section) {

	}

	#deleteAttachmentError(section) {

	}

	#showSection(section) {
		section.classList.remove(`hidden-item`);
	}

	#hideSection(section) {
		section.classList.add(`hidden-item`);
	}

	#addInlineFileToPage() {
		//rigt.before(el)
	}

	#addBlockFileToPage() {
		
	}

	#deleteInlineFile() {

	}

	#deleteBlockFile() {
		
	}
}