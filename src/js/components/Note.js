import BaseComponent from '../helpers/BaseComponent';
import ContextMenu from './popups/ContextMenu';
import Modal from './popups/Modal';
import moment from 'moment'

export default class Note extends BaseComponent {
	constructor(container, data, sectionNotes) {
		super(container);

		this.activeURLBlobs = [];
		this.#renderElement(data, sectionNotes);
	}

	#renderElement(data, sectionNotes) {
		const section = sectionNotes === `files` ?
			`file` :
			`note`

		this.element = document.createElement(`li`);
		this.element.classList.add(`feed-content__item`, `feed-${section}`);
		
		if(section === `file` && data.style === `block`) {
			this.element.classList.add(`feed-block-file`)
		}
		
		this.element.dataset[section] = data.id;

		const noteElementBody = section === `note` ?
			this.#renderNoteElementBody(data) :
			this.#renderFileNoteElementBody(data);

			this.element.append(noteElementBody);
	}

	#renderNoteElementBody(data) {
		const noteElementBody = document.createElement(`article`);
		noteElementBody.classList.add(`feed-note__container`);
		noteElementBody.dataset.note = data.id;

		const noteElementBodyHeader = this.#renderNoteElementBodyHeader(data);
		const noteElementBodyMain = this.#renderNoteElementBodyMain(data)
		const noteElementBodyFooter = this.#renderNoteElementBodyFooter(data);

		noteElementBody.append(noteElementBodyHeader, noteElementBodyMain, noteElementBodyFooter);

		return noteElementBody;
	}

	#renderFileNoteElementBody(data) {
		const noteElementBody = document.createElement(`article`)
		noteElementBody.classList.add(`feed-content-${data.style}-file`)

		if(data.style === `block`) {
			noteElementBody.classList.add(`feed-block-file__body`);

			if(data.type === `other`) {
				noteElementBody.classList.add(`feed-content-other-file`)
			}
		}

		noteElementBody.dataset.file = data.id;

		const fileElementTag = data.type === `other` ? 
			`a` :
			data.type

		const fileElement = document.createElement(fileElementTag);
		const blobLink = this.#createLinkFromBlob(data.src);

		switch (data.type) {
			case `video`:
				fileElement.classList.add(`feed-content-inline-file__file`);
				fileElement.setAttribute(`src`, blobLink);
				fileElement.setAttribute(`controls`, `controls`)
				break;

			case `image`:
				fileElement.classList.add(`feed-content-inline-file__file`);
				fileElement.setAttribute(`src`, blobLink);
				fileElement.setAttribute(`alt`, data.name);
				break;

			case `audio`:
				fileElement.classList.add(`feed-content-audio-file`);
				fileElement.setAttribute(`src`, blobLink);
				fileElement.setAttribute(`controls`, `controls`);
				break;

			default:
				fileElement.classList.add(`feed-content-other-file__link`);
				fileElement.setAttribute(`href`, blobLink);
				fileElement.textContent = data.name;
			}

		const optionsElement = document.createElement(`div`);
		optionsElement.classList.add(`button-icon`, `menu-action`, `feed-content-file__options`, `feed-content-${data.style}-file__options`);

		if(data.style === `block`) {
			optionsElement.classList.add(`menu-action-light`, `feed-block-file__options`);
		}

		optionsElement.dataset.file = data.id;

		optionsElement.innerHTML = `
			<span class="menu-action__span menu-action__dot"></span>
			<span class="menu-action__span menu-action__dot"></span>
			<span class="menu-action__span menu-action__dot"></span>
		`

		noteElementBody.append(fileElement, optionsElement)

		return noteElementBody;
	}

	#renderNoteElementBodyHeader(note) {
		const headerElement = document.createElement(`header`);
		headerElement.classList.add(`feed-note__header`);

		const headerElementGeolocation = document.createElement(`span`)
		headerElementGeolocation.classList.add(`feed-note__geo`)
		
		if(note.geolocation && Array.isArray(note.geolocation)) {
			headerElementGeolocation.innerHTML = `
				${note.geolocation[0]} - ${note.geolocation[1]}
			`
		}
		
		const headerElementOptions = document.createElement(`div`);
		headerElementOptions.classList.add(`button-icon`, `menu-action`, `feed-note__context-menu-open`);
		headerElementOptions.dataset.note = note.id;
		headerElementOptions.innerHTML = `
			<span class="menu-action__span menu-action__dot"></span>
			<span class="menu-action__span menu-action__dot"></span>
			<span class="menu-action__span menu-action__dot"></span>
		`
		headerElement.append(
			headerElementGeolocation, 
			headerElementOptions
		);
		return headerElement;
	}

	#renderNoteElementBodyMain(note) {
		const mainElement = document.createElement(`main`);
		mainElement.classList.add(`feed-note__content`);

		const inlineAttachment = [];

		if(note.attachment.videos) {
			note.attachment.videos.forEach(item => {
				inlineAttachment.push({
					type: `video`,
					file: item,
				})
			})
		}

		if(note.attachment.images) {
			note.attachment.images.forEach(item => {
				inlineAttachment.push({
					type: `image`,
					file: item,
				})
			})
		}

		const blockAttachment = [];

		if(note.attachment.audios) {
			note.attachment.audios.forEach(item => {
				blockAttachment.push({
					type: `audio`,
					file: item,
				})
			})
		}

		if(note.attachment.others) {
			note.attachment.others.forEach(item => {
				blockAttachment.push({
					type: `other`,
					file: item,
				})
			})
		}

		if(inlineAttachment.length === 0) {
			mainElement.classList.add(`feed-note__empty-attachment-inline`)
		}

		const mainElementInlineAttachment = this.#renderNoteElementBodyMainInlineAttachment(inlineAttachment);
  	const mainElementText = this.#renderNoteElementBodyMainText(note.text);
  	const mainElementBlockAttachment = this.#renderNoteElementBodyMainBlockAttachment(blockAttachment);

  	mainElement.append(
  		mainElementInlineAttachment,
  		mainElementText,
  		mainElementBlockAttachment
  	)

		return mainElement;
	}

	#renderNoteElementBodyFooter(note) {
		const footerElement = document.createElement(`footer`);
		footerElement.classList.add(`feed-note__footer`);
		footerElement.dataset.note = note.id;

		const footerElementTagList = this.#renderFooterElementTagList(note.tags);

		const footerElementInfo = this.#renderFooterElementInfo(note.dates);

		footerElement.append(
			footerElementTagList, 
			footerElementInfo
		);
		return footerElement;
	}

	#renderNoteElementBodyMainInlineAttachment(attachment) {
		const attachmentContainer = document.createElement(`div`);
		attachment.forEach(async item => {
			const response = await fetch(item.type.src);
			const blob = await response.blob();
			const link = URL.createObjectURL(blob);
console.log(link, item.type)
			if(item.type === `video`) {
				link.videoWidth
			}
		})


		// 										<div class="feed-note__attachment-inline image-mosaic image-mosaic-horizontal-media-muptiple-three-and-two">
// 											<div class="image-mosaic__item feed-content-inline-file">
// 												<img src="../../sample/img-2.jpg" data-file="165447" alt="name img" class="feed-content-inline-file__file">

// 												<div class="button-icon menu-action feed-content-file__options feed-content-inline-file__options" data-name="feedNoteFileContextMenuOpen" data-file="1548">
// 													<span class="menu-action__span menu-action__dot"></span>
// 													<span class="menu-action__span menu-action__dot"></span>
// 													<span class="menu-action__span menu-action__dot"></span>
// 												</div>
// 											</div>

// 											<div class="image-mosaic__item feed-content-inline-file">
// 												<img src="../../sample/img-3.jpg" data-file="165447" alt="name img" class="feed-content-inline-file__file">

// 												<div class="button-icon menu-action feed-content-file__options feed-content-inline-file__options" data-name="feedNoteFileContextMenuOpen" data-file="1548">
// 													<span class="menu-action__span menu-action__dot"></span>
// 													<span class="menu-action__span menu-action__dot"></span>
// 													<span class="menu-action__span menu-action__dot"></span>
// 												</div>
// 											</div>
											
										
// 											<div class="image-mosaic__item feed-content-inline-file">
// 												<img src="../../sample/img-2.jpg" data-file="165447" alt="name img" class="feed-content-inline-file__file">

// 												<div class="button-icon menu-action feed-content-file__options feed-content-inline-file__options" data-name="feedNoteFileContextMenuOpen" data-file="1548">
// 													<span class="menu-action__span menu-action__dot"></span>
// 													<span class="menu-action__span menu-action__dot"></span>
// 													<span class="menu-action__span menu-action__dot"></span>
// 												</div>
// 											</div>

// 											<div class="image-mosaic__item feed-content-inline-file">
// 												<img src="../../sample/img-3.jpg" data-file="165447" alt="name img" class="feed-content-inline-file__file">

// 												<div class="button-icon menu-action feed-content-file__options feed-content-inline-file__options" data-name="feedNoteFileContextMenuOpen" data-file="1548">
// 													<span class="menu-action__span menu-action__dot"></span>
// 													<span class="menu-action__span menu-action__dot"></span>
// 													<span class="menu-action__span menu-action__dot"></span>
// 												</div>
// 											</div>

// 											<div class="image-mosaic__item feed-content-inline-file">
// 												<img src="../../sample/img-3.jpg" data-file="165447" alt="name img" class="feed-content-inline-file__file">

// 												<div class="button-icon menu-action feed-content-file__options feed-content-inline-file__options" data-name="feedNoteFileContextMenuOpen" data-file="1548">
// 													<span class="menu-action__span menu-action__dot"></span>
// 													<span class="menu-action__span menu-action__dot"></span>
// 													<span class="menu-action__span menu-action__dot"></span>
// 												</div>
// 											</div>										
// 										</div>
		
// this.staticElements.img.onload = () => console.log(this.staticElements.img.naturalHeight, this.staticElements.img.naturalWidth)

	}

	#renderNoteElementBodyMainText(text) {
		const textContainer = document.createElement(`div`)
		textContainer.classList.add(`feed-note__text`);
		textContainer.innerHTML = text;

		return textContainer;
	}

	#renderNoteElementBodyMainBlockAttachment(attachment) {
		const attachmentContainer = document.createElement(`div`);
		attachmentContainer.classList.add(`feed-note__attachment-block`);

		const attachmentElements = [];

		attachment.forEach(async item => {
			const attachmentElement = document.createElement(`div`);
			attachmentElement.classList.add(`feed-content-block-file`);
			attachmentElement.dataset.file = item.file.id;

			// const elementFileLink = await this.#createLinkFromBlob(item.file.src)
			console.log(`после - вернуть генерацию урал из блоба`)
const elementFileLink = item.file.src
			switch(item.type) {
				case `audio`:
					attachmentElement.innerHTML = `
						<audio src="${elementFileLink}" controls="controls" preload="metadata" class="feed-content-audio-file">
						</audio>
					`
					break;

				default:
					attachmentElement.classList.add(`feed-content-other-file`);
					attachmentElement.innerHTML = `
						<a href="${elementFileLink}" class="feed-content-block-file feed-content-other-file__link" download="download">
							${item.file.name}
						</a>
					`
			}

			attachmentElement.innerHTML += `
				<div class="button-icon menu-action menu-action-light feed-content-file__options feed-content-block-file__options" data-name="feedNoteFileContextMenuOpen" data-file="1548">
	 				<span class="menu-action__span menu-action__dot"></span>
	 				<span class="menu-action__span menu-action__dot"></span>
	 				<span class="menu-action__span menu-action__dot"></span>
				</div>
			`

			attachmentElements.push(attachmentElement)
		})

		attachmentElements.length === 0 ? 
			attachmentContainer.classList.add(`hidden-item`) :
			attachmentContainer.append(...attachmentElements)

		return attachmentContainer;
	}

	#renderFooterElementTagList(tags) {
		const footerElementTagList = document.createElement(`ul`);
		footerElementTagList.classList.add(`tags-row`, `feed-note__tags`);
		
		const tagElements = [];
		
		if(tags && Array.isArray(tags)) {
			tags.forEach(tag => {
				const tagElement = document.createElement(`li`);
				tagElement.classList.add(`tag-inline`, `feed-note__tag`)
				tagElement.dataset.tag = tag.id;
				tagElement.innerHTML = `
					<div class="tag-inline__title tag-inline__section" data-name="feedNoteTag">
						${tag.title}
					</div>
				`
				tagElements.push(tagElement)
			})
		} 

		tagElements.length === 0 ?
			footerElementTagList.classList.add(`hidden-item`) :
			footerElementTagList.append(...tagElements);

		return footerElementTagList;
	}

	#renderFooterElementInfo(dates) {
		const footerElementInfo = document.createElement(`div`);
		footerElementInfo.classList.add(`feed-note__footer-info`)

		const footerElementInfoStatus = document.createElement(`div`);
		footerElementInfoStatus.classList.add(`figure-button`, `feed-note__sending`);
		footerElementInfoStatus.dataset.name = "feedNotesending";
		footerElementInfoStatus.innerHTML = `
			<span class="figure-button__item figure-button__chek feed-note__sending-icon feed-note__sending-icon-1">
			</span>

      <span class="figure-button__item figure-button__chek feed-note__sending-icon feed-note__sending-icon-2">
      </span>
		`
								
		const footerElementInfoCreated = document.createElement(`span`);
		footerElementInfoCreated.classList.add(`feed-note__date`);
		const formatedDateCreated = moment(dates.created).locale("ru").format("DD MMMM hh:mm")
		footerElementInfoCreated.textContent = formatedDateCreated;
				
		const footerElementInfoEdited = document.createElement(`span`);
		footerElementInfoEdited.classList.add(`feed-note__edited`);
		footerElementInfoEdited.dataset.name = "noteEdited";

		if(dates.edited) {
			footerElementInfoEdited.textContent = `Редактировалось`
		}

		footerElementInfo.append(
			footerElementInfoEdited, 
			footerElementInfoStatus, 
			footerElementInfoCreated
		);
		return footerElementInfo
	}




	#calcOrientationUnlineAttachment(attachment) {

	}

	async #createLinkFromBlob(blob) {

console.log(`delete async and code`)


	const response = await fetch(blob)
	const blobFile = await response.blob()
	const blobLink = URL.createObjectURL(blobFile)
console.log(`delete`)


		// const blobLink = URL.createObjectURL(blob);
		this.activeURLBlobs.push(blobLink);

		return blobLink;
	}

	removeURLBlobs() {
		this.activeURLBlobs.forEach(item => URL.revokeObjectURL(item));
		this.activeURLBlobs = []
	}
}