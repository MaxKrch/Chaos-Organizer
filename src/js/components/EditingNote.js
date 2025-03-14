import BaseComponent from '../helpers/BaseComponent';
import ContextMenuAddingTag from './popups/ContextMenuAddingTag';
import Modal from './popups/Modal';
import {
  Subject,
  fromEvent,
  throttleTime,
  debounceTime,
  filter,
  map,
} from 'rxjs';
import { routes } from '../consts/index.js';

export default class EditingNote extends BaseComponent {
  constructor(container, note, callback) {
    super(container);

    this.note = note;
    this.existTags = [];
    this.server = routes.server;
    this.removedAttachment = {};

    this.staticElements = {
      body: null,
      header: {
        container: null,
        cancelButton: null,
        saveButton: null,
      },
      main: {
        container: null,
        text: null,
        attachment: {
          container: null,
          inline: null,
          block: null,
        },
      },
      footer: {
        container: null,
        listTags: null,
        addTag: null,
      },
    };

    this.#initComponent(callback);
  }

  #initComponent(callback) {
    this.#renderElement();
    this.#createStreams();
    this.#subscribeToStreams(callback);
    this.addElementToPage();
    if (!this.note.tags) {
      this.note.tags = [];
    }

    this.#updateTagList(this.note.tags);
    this.#updateAttachment(this.note.attachment);
    this.#setCursorPosition();
  }

  #renderElement() {
    this.element = document.createElement(`section`);
    this.element.classList.add(
      `feed-content__item`,
      `feed-note`,
      `editing-note`,
    );

    this.#renderBodyElement();
    this.element.append(this.staticElements.body);
  }

  #renderBodyElement() {
    this.staticElements.body = document.createElement(`article`);
    this.staticElements.body.classList.add(
      `feed-note__container`,
      `editing-note__container`,
    );

    this.#renderHeaderElement();
    this.#renderMainElement();
    this.#renderFooterElement();

    this.staticElements.body.append(
      this.staticElements.header.container,
      this.staticElements.main.container,
      this.staticElements.footer.container,
    );
  }

  #renderHeaderElement() {
    this.staticElements.header.container = document.createElement(`header`);
    this.staticElements.header.container.classList.add(`editing-note__header`);

    this.staticElements.header.cancelButton = document.createElement(`div`);
    this.staticElements.header.cancelButton.classList.add(
      `button`,
      `editing-note__button`,
    );
    this.staticElements.header.cancelButton.dataset.targetAction = `cancelEditingNote`;
    this.staticElements.header.cancelButton.innerHTML = `
			<span class="editing-note__button-title">
				Отменить
			</span>
			<span class="figure-button figure-button__cross editing-note__button-icon editing-note__button-icon-cross">
			</span>
		`;

    this.staticElements.header.saveButton = document.createElement(`div`);
    this.staticElements.header.saveButton.classList.add(
      `button`,
      `editing-note__button`,
    );
    this.staticElements.header.saveButton.dataset.targetAction = `saveEditedNote`;
    this.staticElements.header.saveButton.innerHTML = `
			<span class="editing-note__button-title">
				Сохранить
			</span>
			<span class="figure-button figure-button__chek editing-note__button-icon editing-note__button-icon-chek">
			</span>
		`;
    this.staticElements.header.container.append(
      this.staticElements.header.cancelButton,
      this.staticElements.header.saveButton,
    );
  }

  #renderMainElement() {
    this.staticElements.main.container = document.createElement(`main`);
    this.staticElements.main.container.classList.add(`editing-note__main`);

    this.#renderMainText();
    this.#renderMainAttachment();

    this.staticElements.main.container.append(
      this.staticElements.main.text,
      this.staticElements.main.attachment.container,
    );
  }

  #renderFooterElement() {
    this.staticElements.footer.container = document.createElement(`footer`);
    this.staticElements.footer.container.classList.add(
      `feed-note__footer`,
      `editing-note__footer`,
    );

    this.staticElements.footer.addTag = document.createElement(`div`);
    this.staticElements.footer.addTag.classList.add(
      `button-inline`,
      `editing-note__add-tag`,
    );
    this.staticElements.footer.addTag.dataset.targetAction = `openContexMenuAddingTagToNote`;
    this.staticElements.footer.addTag.innerHTML = `
			<div class="editing-note__add-tag-text">
				Добавить тег
			</div>
			<div class="editing-note__add-tag-icon">
			</div>
		`;

    this.staticElements.footer.listTags = document.createElement(`ul`);
    this.staticElements.footer.listTags.classList.add(
      `tags-row`,
      `editing-note__tags`,
    );

    this.staticElements.footer.container.append(
      this.staticElements.footer.addTag,
      this.staticElements.footer.listTags,
    );
  }

  #renderMainText() {
    this.staticElements.main.text = document.createElement(`div`);
    this.staticElements.main.text.classList.add(
      `feed-note__text`,
      `editing-note__text`,
    );
    this.staticElements.main.text.setAttribute(`contenteditable`, true);
    this.staticElements.main.text.innerHTML = this.note.text;
  }

  #renderMainAttachment() {
    this.staticElements.main.attachment.container =
      document.createElement(`section`);
    this.staticElements.main.attachment.container.classList.add(
      `create-note__attachment`,
      `editing-note__attachment`,
    );

    this.staticElements.main.attachment.inline = document.createElement(`ul`);
    this.staticElements.main.attachment.inline.classList.add(
      `create-note__attachment-inline-list`,
      `editing-note__attachment-inline`,
    );

    this.staticElements.main.attachment.block = document.createElement(`ul`);
    this.staticElements.main.attachment.block.classList.add(
      `create-note__attachment-block-list`,
      `editing-note__attachment-block`,
    );

    this.staticElements.main.attachment.container.append(
      this.staticElements.main.attachment.inline,
      this.staticElements.main.attachment.block,
    );
  }

  #createContextMenuAddingTag() {
    if (this.contextMenu) {
      this.contextMenu.deleteElement();
      this.contextMenu = null;
    }

    const tags = {
      exist: this.existTags,
      note: this.note.tags,
    };

    this.contextMenu = new ContextMenuAddingTag(
      this.container,
      this.staticElements.footer.addTag,
      this.#onRequestActionFromContextMenuAddingTag.bind(this),
      tags,
    );

    this.addOverlay();
    this.disableScrolling();

    this.contextMenu.addElementToPage();
    this.contextMenu.positiongOnPage();
  }

  #removeContextMenu() {
    this.contextMenu.deleteElement();
    this.contextMenu = null;
    this.removeOverlay();
    this.enableScrolling();
  }

  #createStreams() {
    this.saveStream(`requestAction`, new Subject());

    const clicksOnElement = fromEvent(this.element, `click`).pipe(
      throttleTime(150),
    );
    this.saveStream(`clicksOnElement`, clicksOnElement);
  }

  #subscribeToStreams(callback) {
    this.subscribeToStream(`requestAction`, callback);
    this.subscribeToStream(
      `clicksOnElement`,
      this.#onClickByElement.bind(this),
    );
  }

  #setCursorPosition() {
    this.staticElements.main.text.focus();

    const range = document.createRange();
    range.selectNodeContents(this.staticElements.main.text);
    range.collapse(false);

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  updateExistTags(tags) {
    this.existTags = tags;
  }

  #updateAttachment(attachment) {
    const inlineAttachment = [];

    if (attachment.video) {
      attachment.video.forEach((item) => {
        const newElement = this.#createAttachmentElement(item, `video`);
        inlineAttachment.push(newElement);
      });
    }

    if (attachment.image) {
      attachment.image.forEach((item) => {
        const newElement = this.#createAttachmentElement(item, `image`);
        inlineAttachment.push(newElement);
      });
    }
    this.staticElements.main.attachment.inline.innerHTML = ``;
    this.staticElements.main.attachment.inline.append(...inlineAttachment);

    const blockAttachment = [];

    if (attachment.audio) {
      attachment.audio.forEach((item) => {
        const newElement = this.#createAttachmentElement(item, `audio`);
        blockAttachment.push(newElement);
      });
    }

    if (attachment.other) {
      attachment.other.forEach((item) => {
        const newElement = this.#createAttachmentElement(item, `other`);
        blockAttachment.push(newElement);
      });
    }
    this.staticElements.main.attachment.block.innerHTML = ``;
    this.staticElements.main.attachment.block.append(...blockAttachment);
  }

  #updateTagList(tags) {
    if (!tags) {
      return;
    }

    this.staticElements.footer.listTags.innerHTML = ``;

    const emptyElement = document.createElement(`li`);
    emptyElement.classList.add(
      `tag-inline`,
      `feed-note__tag`,
      `editing-note__empty-tag`,
    );

    const tagElements = [emptyElement];

    tags.forEach((tag) => {
      const tagElement = this.#createTagElement(tag);
      tagElements.push(tagElement);
    });

    this.staticElements.footer.listTags.append(...tagElements);
  }

  #createTagElement(tag) {
    const tagElement = document.createElement(`li`);
    tagElement.classList.add(
      `tag-inline`,
      `feed-note__tag`,
      `editing-note__tag`,
    );
    tagElement.dataset.tagId = tag.id;
    tagElement.dataset.name = `tagContainer`;
    tagElement.innerHTML = `
			<div class="tag-inline__title tag-inline__section">
				${tag.title}
			</div>

			<div class="button-icon tag-inline__section tag-inline__options figure-button create-note__added-tag-remove" data-tag-id="${tag.id}" data-target-action="removeTagFromNote">
				<div class="figure-button__item figure-button__cross create-note__added-tag-remove-cross">
			</div>
		</div>
		`;

    return tagElement;
  }

  #createAttachmentElement(file, type) {
    const attachmentElement = document.createElement(`li`);
    attachmentElement.dataset.name = `attachmentContainer`;
    attachmentElement.dataset.attachmentId = file.id;
    attachmentElement.dataset.attachmentType = type;

    switch (type) {
      case `video`:
        attachmentElement.innerHTML = `
					<video src="${this.server}${file.src}" class="create-note__attachment-inline-file feed-note-video__file">
					</video>
				`;
        break;

      case `image`:
        attachmentElement.innerHTML = `
					<img src="${this.server}${file.src}" class="create-note__attachment-inline-file" alt="${file.title}">
					</img>
				`;
        break;

      case `audio`:
        attachmentElement.innerHTML = `
					<audio src="${this.server}${file.src}" class="create-note__attachment-block-file" controls="controls">
					</audio>
				`;
        break;

      default:
        attachmentElement.innerHTML = `
					<a href="${this.server}${file.src}" class="feed-content-other-file create-note__attachment-block-file">
						${file.title}
					</a>
				`;
    }

    if (type === `video` || type === `image`) {
      attachmentElement.classList.add(`create-note__attachment-inline-item`);
      attachmentElement.innerHTML += `
				<div class="button-icon figure-button create-note__attachment-inline-remove" data-target-action="removeAttachmentFromNote">
					<div class="figure-button__item figure-button__cross create-note__attachment-inline-remove-cross">
					</div>
				</div>
			`;
    } else {
      attachmentElement.classList.add(`create-note__attachment-block-item`);
      attachmentElement.innerHTML += `
				<div class="figure-button create-note__attachment-block-remove" data-target-action="removeAttachmentFromNote">
					<div class="figure-button__item figure-button__cross create-note__attachment-block-remove-cross">
					</div>
				</div>
			`;
    }

    return attachmentElement;
  }

  #onClickByElement(event) {
    if (this.contextMenu) {
      return;
    }

    event.stopPropagation();

    const targetElement = event.target.closest(`[data-target-action]`);

    if (!targetElement) {
      return;
    }

    const targetAction = targetElement.dataset.targetAction;

    switch (targetAction) {
      case `openContexMenuAddingTagToNote`:
        this.#createContextMenuAddingTag();
        break;

      case `removeTagFromNote`:
        const targetTagElement = targetElement.closest(
          `[data-name="tagContainer"]`,
        );
        this.#removeTagFromNote(targetTagElement);
        break;

      case `removeAttachmentFromNote`:
        const targetAttachmentElement = targetElement.closest(
          `[data-name="attachmentContainer"]`,
        );
        this.#removeAttachmentFromNote(targetAttachmentElement);
        break;

      case `cancelEditingNote`:
        this.addDataToStream(`requestAction`, {
          action: `cancel`,
        });
        break;

      case `saveEditedNote`:
        this.note.dates.edited = Date.now();
        this.note.removedAttachment = this.removedAttachment;
        this.note.text = this.staticElements.main.text.innerHTML.trim();
        this.addDataToStream(`requestAction`, {
          action: `save`,
          note: this.note,
        });
        break;
    }
  }

  #onRequestActionFromContextMenuAddingTag(data) {
    switch (data.action) {
      case `closeContextMenu`:
        this.#removeContextMenu();
        break;

      case `addTagToNote`:
        this.#addTagToNote(data.tag);
        this.#removeContextMenu();
        break;
    }
  }

  #addTagToNote(tag) {
    if (tag.new === true) {
      tag.id = `${Date.now()}${this.note.tags.length}`;
    }

    const tagElement = this.#createTagElement(tag);
    this.staticElements.footer.listTags.append(tagElement);
    this.note.tags.push(tag);
  }

  #removeTagFromNote(tagElement) {
    const tagId = tagElement.dataset.tagId;
    const tagIndex = this.note.tags.findIndex((tag) => tag.id === tagId);

    this.note.tags.splice(tagIndex, 1);
    tagElement.remove();
  }

  #removeAttachmentFromNote(attachmentElement) {
    const { attachmentType, attachmentId } = attachmentElement.dataset;

    if (!this.removedAttachment[attachmentType]) {
      this.removedAttachment[attachmentType] = [];
    }

    const targetBlockAttachment = this.note.attachment[attachmentType];
    const indexTargetAttachment = targetBlockAttachment.findIndex(
      (item) => item.id === attachmentId,
    );

    const arrayNewRemovedAttachment = targetBlockAttachment.splice(
      indexTargetAttachment,
      1,
    );

    this.removedAttachment[attachmentType].push(arrayNewRemovedAttachment[0]);
    attachmentElement.remove();
  }

  addOverlay() {
    this.staticElements.body.classList.add(`section-overlay`);
  }

  removeOverlay() {
    this.staticElements.body.classList.remove(`section-overlay`);
  }
}
