import moment from 'moment';

import addActiveLinks from '../helpers/addActiveLinks';

export default class Note {
  constructor(note, location, serverPath) {
    this.serverPath = serverPath;
    this.savedOnServer = note.savedOnServer;
    this.location = location;

    return this.#renderElement(note);
  }

  #renderElement(note) {
    const typeActiveLocation =
      this.location.section === `files` ? `file` : `note`;

    const noteElement = document.createElement(`li`);
    noteElement.classList.add(
      `feed-content__item`,
      `feed-${typeActiveLocation}`,
    );

    if (typeActiveLocation === `file` && note.style === `block`) {
      noteElement.classList.add(`feed-block-file`);
    }

    noteElement.dataset.name = `feedContentItem`;
    noteElement.dataset.id = note.id;

    const noteElementBody =
      typeActiveLocation === `file`
        ? this.#renderFileNoteElementBody(note)
        : this.#renderNoteElementBody(note);

    noteElement.append(noteElementBody);

    return noteElement;
  }

  #renderNoteElementBody(note) {
    const noteElementBody = document.createElement(`article`);
    noteElementBody.classList.add(`feed-note__container`);
    noteElementBody.dataset.id = note.id;

    const noteElementBodyHeader = this.#renderNoteElementBodyHeader(note);
    const noteElementBodyMain = this.#renderNoteElementBodyMain(note);
    const noteElementBodyFooter = this.#renderNoteElementBodyFooter(note);

    noteElementBody.append(
      noteElementBodyHeader,
      noteElementBodyMain,
      noteElementBodyFooter,
    );

    return noteElementBody;
  }

  #renderFileNoteElementBody(file) {
    const fileStyle =
      this.location.category === `image` || this.location.category === `video`
        ? `inline`
        : `block`;

    const noteElementBody = document.createElement(`article`);
    noteElementBody.classList.add(`feed-content-${fileStyle}-file`);

    if (fileStyle === `block`) {
      noteElementBody.classList.add(`feed-block-file__body`);

      if (this.location.category === `other`) {
        noteElementBody.classList.add(`feed-content-other-file`);
      }
    }

    noteElementBody.dataset.file = file.id;

    let fileElementTag = this.location.category;
    if (this.location.category === `image`) fileElementTag = `img`;
    if (this.location.category === `other`) fileElementTag = `a`;

    const fileElement = document.createElement(fileElementTag);
    const fullLink = `${this.serverPath}${file.src}`;

    switch (this.location.category) {
      case `video`:
        fileElement.classList.add(`feed-content-inline-file__file`);
        fileElement.setAttribute(`src`, fullLink);
        fileElement.setAttribute(`controls`, `controls`);
        fileElement.setAttribute(`preload`, `metadata`);
        if (file.poster) {
          fileElement.setAttribute(
            `poster`,
            `${this.serverPath}${file.poster}`,
          );
        }
        break;

      case `image`:
        fileElement.classList.add(`feed-content-inline-file__file`);
        fileElement.setAttribute(`src`, fullLink);
        fileElement.setAttribute(`loading`, `lazy`);
        fileElement.setAttribute(`alt`, file.title);
        fileElement.setAttribute(`crossorigin`, `anonymous`);
        break;

      case `audio`:
        fileElement.classList.add(`feed-content-audio-file`);
        fileElement.setAttribute(`src`, fullLink);
        fileElement.setAttribute(`controls`, `controls`);
        break;

      default:
        fileElement.classList.add(`feed-content-other-file__link`);
        fileElement.setAttribute(`href`, fullLink);
        fileElement.onclick = (event) => event.preventDefault();
        fileElement.textContent = file.title;
    }

    const optionsElement = document.createElement(`div`);
    optionsElement.classList.add(
      `button-icon`,
      `menu-action`,
      `feed-content-file__options`,
      `feed-content-${fileStyle}-file__options`,
    );

    if (fileStyle === `block`) {
      optionsElement.classList.add(
        `menu-action-light`,
        `feed-block-file__options`,
      );
    }

    optionsElement.dataset.file = file.id;
    optionsElement.dataset.note = file.note;
    optionsElement.dataset.fileType = this.location.category;
    optionsElement.dataset.clickAction = `fileNoteContextMenuOpen`;
    optionsElement.innerHTML = `
			<span class="menu-action__span menu-action__dot"></span>
			<span class="menu-action__span menu-action__dot"></span>
			<span class="menu-action__span menu-action__dot"></span>
		`;

    noteElementBody.append(fileElement, optionsElement);

    return noteElementBody;
  }

  #renderNoteElementBodyHeader(note) {
    const headerElement = document.createElement(`header`);
    headerElement.classList.add(`feed-note__header`);

    const headerElementGeolocation = document.createElement(`span`);
    headerElementGeolocation.classList.add(`feed-note__geo`);

    if (note.geolocation?.[0] && note.geolocation?.[1]) {
      headerElementGeolocation.innerHTML = `
				${note.geolocation[0]} ${note.geolocation[1]}
			`;
    }

    const headerElementOptions = document.createElement(`div`);
    headerElementOptions.classList.add(
      `button-icon`,
      `menu-action`,
      `feed-note__context-menu-open`,
    );
    headerElementOptions.dataset.clickAction = `noteContextMenuOpen`;
    headerElementOptions.dataset.note = note.id;
    headerElementOptions.innerHTML = `
			<span class="menu-action__span menu-action__dot"></span>
			<span class="menu-action__span menu-action__dot"></span>
			<span class="menu-action__span menu-action__dot"></span>
		`;
    headerElement.append(headerElementGeolocation, headerElementOptions);
    return headerElement;
  }

  #renderNoteElementBodyMain(note) {
    const mainElement = document.createElement(`main`);
    mainElement.classList.add(`feed-note__content`);

    const inlineAttachment = [];

    if (note.attachment?.video) {
      note.attachment.video.forEach((item) => {
        inlineAttachment.push({
          type: `video`,
          file: item,
        });
      });
    }

    if (note.attachment?.image) {
      note.attachment.image.forEach((item) => {
        inlineAttachment.push({
          type: `image`,
          file: item,
        });
      });
    }

    const blockAttachment = [];

    if (note.attachment?.audio) {
      note.attachment.audio.forEach((item) => {
        blockAttachment.push({
          type: `audio`,
          file: item,
        });
      });
    }

    if (note.attachment?.other) {
      note.attachment.other.forEach((item) => {
        blockAttachment.push({
          type: `other`,
          file: item,
        });
      });
    }

    if (
      (inlineAttachment.length === 0 && blockAttachment.length === 0) ||
      note.text.length === 0
    ) {
      mainElement.classList.add(`feed-note__empty-attachment-inline`);
    }

    const mainElementInlineAttachment =
      this.#renderNoteElementBodyMainInlineAttachment(inlineAttachment);
    const mainElementText = this.#renderNoteElementBodyMainText(note.text);
    const mainElementBlockAttachment =
      this.#renderNoteElementBodyMainBlockAttachment(blockAttachment);

    mainElement.append(
      mainElementInlineAttachment,
      mainElementText,
      mainElementBlockAttachment,
    );

    return mainElement;
  }

  #renderNoteElementBodyFooter(note) {
    const footerElement = document.createElement(`footer`);
    footerElement.classList.add(`feed-note__footer`);
    footerElement.dataset.note = note.id;

    const footerElementTagList = this.#renderFooterElementTagList(note.tags);
    const footerElementInfo = this.#renderFooterElementInfo(note);

    footerElement.append(footerElementTagList, footerElementInfo);
    return footerElement;
  }

  #renderNoteElementBodyMainInlineAttachment(attachment) {
    const attachmentContainer = document.createElement(`div`);
    attachmentContainer.classList.add(`feed-note__attachment-inline`);

    if (attachment[0]) {
      this.#setStyleMosaicInlineAttachment(
        attachment[0],
        attachment.length,
        attachmentContainer,
      );
    }

    const attachmentElements = [];

    attachment.forEach((item) => {
      const attachmentElement = document.createElement(`div`);
      attachmentElement.classList.add(
        `image-mosaic__item`,
        `feed-content-inline-file`,
      );
      attachmentContainer.dataset.name = `attachmentContainer`;
      attachmentContainer.dataset.file = item.file.id;

      const fullLink = `${this.serverPath}${item.file.src}`;

      switch (item.type) {
        case `video`: {
          const poster = item.file.poster
            ? `poster="${this.serverPath}${item.file.poster}"`
            : ``;
          attachmentElement.innerHTML = `
 						<video src="${fullLink}" controls="controls" data-file="${item.file.id}" preload="metadata" ${poster} class="feed-content-inline-file__file">
						</video>
					`;
          break;
        }

        case `image`:
          attachmentElement.innerHTML = `
						<img src="${fullLink}" data-file="${item.file.id}" alt="${item.file.title}" loading="lazy" crossorigin="anonymous" class="feed-content-inline-file__file">
					`;
          break;

        default:
          return;
      }

      attachmentElement.innerHTML += `
				<div class="button-icon menu-action feed-content-file__options feed-content-inline-file__options" data-click-action="noteAttachmentContextMenuOpen" data-file="${item.file.id}" data-file-type="${item.type}">
 					<span class="menu-action__span menu-action__dot"></span>
 					<span class="menu-action__span menu-action__dot"></span>
					<span class="menu-action__span menu-action__dot"></span>
				</div>
			`;

      attachmentElements.push(attachmentElement);
    });

    attachmentElements.length === 0
      ? attachmentContainer.classList.add(`hidden-item`)
      : attachmentContainer.append(...attachmentElements);

    return attachmentContainer;
  }

  #renderNoteElementBodyMainText(text) {
    const textWithActiveLinks = addActiveLinks(text);
    const textContainer = document.createElement(`div`);
    textContainer.classList.add(`feed-note__text`);
    textContainer.innerHTML = textWithActiveLinks;

    return textContainer;
  }

  #renderNoteElementBodyMainBlockAttachment(attachment) {
    const attachmentContainer = document.createElement(`div`);
    attachmentContainer.classList.add(`feed-note__attachment-block`);

    const attachmentElements = [];

    attachment.forEach(async (item) => {
      const attachmentElement = document.createElement(`div`);
      attachmentElement.classList.add(`feed-content-block-file`);
      attachmentContainer.dataset.name = `attachmentContainer`;
      attachmentElement.dataset.file = item.file.id;

      const elementFileLink = `${this.serverPath}${item.file.src}`;
      switch (item.type) {
        case `audio`:
          attachmentElement.innerHTML = `
						<audio src="${elementFileLink}" controls="controls" preload="metadata" class="feed-content-audio-file">
						</audio>
					`;
          break;

        default:
          attachmentElement.classList.add(`feed-content-other-file`);
          attachmentElement.innerHTML = `
						<a href="${elementFileLink}" class="feed-content-block-file feed-content-other-file__link" download="download" onclick="event.preventDefault()">
							${item.file.title}
						</a>
					`;
      }

      attachmentElement.innerHTML += `
				<div class="button-icon menu-action menu-action-light feed-content-file__options feed-content-block-file__options" data-file-type="${item.type}" data-click-action="noteAttachmentContextMenuOpen" data-file="${item.file.id}">
	 				<span class="menu-action__span menu-action__dot"></span>
	 				<span class="menu-action__span menu-action__dot"></span>
	 				<span class="menu-action__span menu-action__dot"></span>
				</div>
			`;

      attachmentElements.push(attachmentElement);
    });

    attachmentElements.length === 0
      ? attachmentContainer.classList.add(`hidden-item`)
      : attachmentContainer.append(...attachmentElements);

    return attachmentContainer;
  }

  #renderFooterElementTagList(tags) {
    const footerElementTagList = document.createElement(`ul`);
    footerElementTagList.classList.add(`tags-row`, `feed-note__tags`);

    const tagElements = [];

    if (tags && Array.isArray(tags)) {
      tags.forEach((tag) => {
        const tagElement = document.createElement(`li`);
        tagElement.classList.add(`tag-inline`, `feed-note__tag`);
        if (tag.new) tagElement.dataset.newTag = true;
        tagElement.dataset.tag = tag.id;
        tagElement.dataset.clickAction = `noteSelectTagCategory`;
        tagElement.innerHTML = `
					<div class="tag-inline__title tag-inline__section not-selected">
						${tag.title}
					</div>
				`;
        tagElements.push(tagElement);
      });
    }

    tagElements.length === 0
      ? footerElementTagList.classList.add(`hidden-item`)
      : footerElementTagList.append(...tagElements);

    return footerElementTagList;
  }

  #renderFooterElementInfo(note) {
    const footerElementInfo = document.createElement(`div`);
    footerElementInfo.classList.add(`feed-note__footer-info`);

    const footerElementInfoStatus = document.createElement(`div`);
    footerElementInfoStatus.classList.add(
      `figure-button`,
      `feed-note__sending`,
    );
    footerElementInfoStatus.dataset.name = 'feedNoteSending';

    if (note.savedOnServer === false) {
      footerElementInfoStatus.classList.add(`feed-note__sending_await`);
      footerElementInfoStatus.dataset.sendingStatus = `await`;
    }

    footerElementInfoStatus.innerHTML = `
			<span class="figure-button__item figure-button__chek feed-note__sending-icon feed-note__sending-icon-1">
			</span>

      <span class="figure-button__item figure-button__chek feed-note__sending-icon feed-note__sending-icon-2">
      </span>
		`;

    const footerElementInfoCreated = document.createElement(`span`);
    footerElementInfoCreated.classList.add(`feed-note__date`);
    const formatedDateCreated =
      note.dates && note.dates.created
        ? moment(note.dates.created).locale('ru').format('DD MMMM HH:mm')
        : ``;

    footerElementInfoCreated.textContent = formatedDateCreated;

    const footerElementInfoEdited = document.createElement(`span`);
    footerElementInfoEdited.classList.add(`feed-note__edited`);
    footerElementInfoEdited.dataset.name = 'noteEdited';

    if (note.dates && note.dates.edited) {
      footerElementInfoEdited.textContent = `Редактировалось`;
    }

    footerElementInfo.append(
      footerElementInfoEdited,
      footerElementInfoStatus,
      footerElementInfoCreated,
    );

    return footerElementInfo;
  }

  #setStyleMosaicInlineAttachment(attachment, count, container) {
    container.classList.add(`image-mosaic`);

    const remainder = count % 3;
    const tempClassMosaic = `image-mosaic-temp`;

    container.classList.add(tempClassMosaic);

    let tempClassMosaicOrientatation;

    if (count === 2) {
      tempClassMosaicOrientatation = `image-mosaic-horizontal-media-double`;
    }

    if (count > 2) {
      switch (remainder) {
        case 0:
          tempClassMosaicOrientatation = `image-mosaic-horizontal-media-muptiple-three`;
          break;

        case 1:
          tempClassMosaicOrientatation = `image-mosaic-horizontal-media-muptiple-three-and-one`;
          break;

        case 2:
          tempClassMosaicOrientatation = `image-mosaic-horizontal-media-muptiple-three-and-two`;
          break;
      }
    }

    if (count > 1) {
      container.classList.add(tempClassMosaicOrientatation);
    }

    if (attachment.type === `video`) {
      const tempVideo = document.createElement(`video`);
      tempVideo.setAttribute(`preload`, `metadata`);
      tempVideo.setAttribute(`src`, `${this.serverPath}${attachment.file.src}`);
      tempVideo.onloadeddata = () => {
        const orientation =
          tempVideo.videoHeight / tempVideo.videoWidth > 1
            ? `vertical`
            : `horizontal`;
        this.#updateStyleMosaicInlineAttachment(
          orientation,
          count,
          remainder,
          container,
          tempClassMosaic,
          tempClassMosaicOrientatation,
        );
        tempVideo.remove();
      };
    }

    if (attachment.type === `image`) {
      const tempImg = document.createElement(`img`);
      tempImg.setAttribute(`src`, `${this.serverPath}${attachment.file.src}`);
      tempImg.onload = () => {
        const orientation =
          tempImg.naturalHeight / tempImg.naturalWidth > 1
            ? `vertical`
            : `horizontal`;
        this.#updateStyleMosaicInlineAttachment(
          orientation,
          count,
          remainder,
          container,
          tempClassMosaic,
          tempClassMosaicOrientatation,
        );
        tempImg.remove();
      };
    }
  }

  #updateStyleMosaicInlineAttachment(
    orientation,
    count,
    remainder,
    container,
    tempClassMosaic,
    tempClassMosaicOrientatation,
  ) {
    container.classList.remove(tempClassMosaic);

    if (count === 1) {
      return;
    }

    const classMosaicOrientation = `image-mosaic-${orientation}`;

    if (count === 2) {
      container.classList.add(`${classMosaicOrientation}-media-double`);
      return;
    }

    if (orientation === `vertical`) {
      container.classList.remove(tempClassMosaicOrientatation);

      switch (remainder) {
        case 0:
          container.classList.add(
            `${classMosaicOrientation}-media-muptiple-three`,
          );
          break;

        case 1:
          container.classList.add(
            `${classMosaicOrientation}-media-muptiple-three-and-one`,
          );
          break;

        case 2:
          container.classList.add(
            `${classMosaicOrientation}-media-muptiple-three-and-two`,
          );
          break;
      }
    }
  }
}
