import BaseComponent from '../helpers/BaseComponent';
import ContextMenu from './popups/ContextMenu';
import ModalSidebarChangeTag from './popups/ModalSidebarChangeTag';

import { sidebarStaticElements } from '../consts/index.js';
import {
  Subject,
  merge,
  fromEvent,
  throttleTime,
  filter,
  debounceTime,
} from 'rxjs';

export default class Sidebar extends BaseComponent {
  constructor(container) {
    super(container);
    this.staticElements = {
      container: null,
      allNotes: {
        container: null,
        count: null,
      },
      favorites: {
        container: null,
        count: null,
      },
      files: {
        container: null,
        video: {
          container: null,
          count: null,
        },
        audio: {
          container: null,
          count: null,
        },
        image: {
          container: null,
          count: null,
        },
        other: {
          container: null,
          count: null,
        },
      },
      tags: {
        list: null,
      },
    };
    this.modal = null;
    this.contextMenu = null;
    this.abortControllers = {
      validateTagTitle: null,
    };
  }

  initionRender() {
    this.#createElement();
    this.addElementToPage();
    this.#saveStaticElements();

    this.#createStreams();
    this.#subscribeToStreams();
  }

  #createElement() {
    this.element = document.createElement('article');
    this.element.classList.add('sidebar-main');
    this.element.innerHTML = `
			<section class="sidebar-main-container">
				<div class="sidebar-link-item sidebar-all-notes" data-section="notes" data-category="all" data-id="sidebarAllNotes">
					<span class="sidebar-link-item__name sidebar-all-notes__name" data-id="sidebarAllNotesTitle">
						${sidebarStaticElements.allNotes.description}
					</span>
					<span class="sidebar-link-item__count sidebar-favorites__count" data-id="sidebarAllNotesCount">
						
					</span>
				</div>

				<div class="sidebar-link-item sidebar-favorites" data-section="notes" data-category="favorites" data-id="sidebarFavorites">
					<span class="sidebar-link-item__name sidebar-favorites__name" data-id="sidebarFavoritesTitle">
						${sidebarStaticElements.favorites.description}
					</span>
					<span class="sidebar-link-item__count sidebar-favorites__count" data-id="sidebarFavoritesCount">
						
					</span>
				</div>
					
				<ul class="sidebar-files__container" data-id="sidebarList">
					<li class="sidebar-files sidebar-videos sidebar-link-item" data-section="files" data-category="video" data-id="sidebarVideos">
						<span class="sidebar-link-item__name sidebar-video__name" data-id="sidebarVideosTitle">
								${sidebarStaticElements.files.video.description}
						</span>
						<span class="sidebar-link-item__count sidebar-video__count" data-id="sidebarVideosCount">
							
						</span>
					</li>
							
					<li class="sidebar-files sidebar-audios sidebar-link-item" data-section="files" data-category="audio" data-id="sidebarAudios">
						<span class="sidebar-link-item__name sidebar-audio__name" data-id="sidebarAudiosTitle">
								${sidebarStaticElements.files.audio.description}
						</span>
						<span class="sidebar-link-item__count sidebar-audio__count" data-id="sidebarAudiosCount">
							
						</span>
					</li>
						
					<li class="sidebar-files sidebar-images sidebar-link-item" data-section="files" data-category="image" data-id="sidebarImages">
						<span class="sidebar-link-item__name sidebar-image__name" data-id="sidebarImagesTitle">
								${sidebarStaticElements.files.image.description}
						</span>
						<span class="sidebar-link-item__count sidebar-image__count" data-id="sidebarImagesCount">
							
						</span>
					</li>
							
					<li class="sidebar-files sidebar-other-files sidebar-link-item" data-section="files" data-category="other" data-id="sidebarOtherFiles">
						<span class="sidebar-link-item__name sidebar-other-files__name" data-id="sidebarOtherFilesTitle">
								${sidebarStaticElements.files.other.description}
						</span>
						<span class="sidebar-link-item__count sidebar-other-files__count" data-id="sidebarOtherFilesCount">
							
						</span>
					</li>
				</ul>
								
				<div class="sidebar-tags" data-id="sidebarTags">
					<h2 class="sidebar-tags__title">
						${sidebarStaticElements.tags.description}
					</h2>
			
					<ul class="tags-row sidebar-tags__list" data-id="sidebarTagsList">
					</ul>
				</div>
			</section>
		`;
  }

  #saveStaticElements() {
    if (!this.element) {
      console.log(`empty element`);
      return;
    }

    this.staticElements.container = this.element.querySelector(
      '.sidebar-main-container',
    );

    this.staticElements.allNotes.container = this.element.querySelector(
      `[data-id="sidebarAllNotes"]`,
    );
    this.staticElements.allNotes.count = this.element.querySelector(
      `[data-id="sidebarAllNotesCount"]`,
    );

    this.staticElements.favorites.container = this.element.querySelector(
      `[data-id="sidebarFavorites"]`,
    );
    this.staticElements.favorites.count = this.element.querySelector(
      `[data-id="sidebarFavoritesCount"]`,
    );

    this.staticElements.files.container = this.element.querySelector(
      `[data-id="sidebarList"]`,
    );

    this.staticElements.files.video.container = this.element.querySelector(
      `[data-id="sidebarVideos"]`,
    );
    this.staticElements.files.video.count = this.element.querySelector(
      `[data-id="sidebarVideosCount"]`,
    );

    this.staticElements.files.audio.container = this.element.querySelector(
      `[data-id="sidebarAudios"]`,
    );
    this.staticElements.files.audio.count = this.element.querySelector(
      `[data-id="sidebarAudiosCount"]`,
    );

    this.staticElements.files.image.container = this.element.querySelector(
      `[data-id="sidebarImages"]`,
    );
    this.staticElements.files.image.count = this.element.querySelector(
      `[data-id="sidebarImagesCount"]`,
    );

    this.staticElements.files.other.container = this.element.querySelector(
      `[data-id="sidebarOtherFiles"]`,
    );
    this.staticElements.files.other.count = this.element.querySelector(
      `[data-id="sidebarOtherFilesCount"]`,
    );

    this.staticElements.tags.list = this.element.querySelector(
      `[data-id="sidebarTagsList"]`,
    );
  }

  #createStreams() {
    this.saveStream(`requestNotes`, new Subject());
    this.saveStream(`deleteTag`, new Subject());
    this.saveStream(`changeTag`, new Subject());

    const modalInputTagChange = new Subject().pipe(debounceTime(350));
    this.saveStream(`modalInputTagChange`, modalInputTagChange);

    const clicksOnCategory = merge(
      fromEvent(this.staticElements.allNotes.container, `click`),
      fromEvent(this.staticElements.favorites.container, `click`),
      fromEvent(this.staticElements.files.video.container, `click`),
      fromEvent(this.staticElements.files.audio.container, `click`),
      fromEvent(this.staticElements.files.image.container, `click`),
      fromEvent(this.staticElements.files.other.container, `click`),
    ).pipe(throttleTime(350));
    this.saveStream(`clicksOnCategory`, clicksOnCategory);

    const clicksOnTagTitle = fromEvent(
      this.staticElements.tags.list,
      `click`,
    ).pipe(
      filter((item) => item.target.closest(`[data-name="sidebarTagTitle"]`)),
      throttleTime(350),
    );
    this.saveStream(`clicksOnTagTitle`, clicksOnTagTitle);

    const clicksOnTagOptions = fromEvent(
      this.staticElements.tags.list,
      `click`,
    ).pipe(
      filter((item) => item.target.closest(`[data-name="sidebarTagOptions"]`)),
      throttleTime(350),
    );
    this.saveStream(`clicksOnTagOptions`, clicksOnTagOptions);
  }

  #subscribeToStreams() {
    this.subscribeToStream(
      `clicksOnTagOptions`,
      this.#onClickByTagOptions.bind(this),
    );
    this.subscribeToStream(
      `clicksOnCategory`,
      this.#onClickByCategory.bind(this),
    );
    this.subscribeToStream(
      `clicksOnTagTitle`,
      this.#onClickByCategory.bind(this),
    );
  }

  updateNotesCount(notesCount) {
    if (!notesCount) {
      console.log(`empty element`);
    }

    for (let key in notesCount) {
      if (typeof notesCount[key] === `object`) {
        for (let item in notesCount[key]) {
          const categoryToKey = this.staticElements[key][item];
          categoryToKey.count.textContent = `/ ${notesCount[key][item]} /`;
        }
        continue;
      }

      const category = this.staticElements[key];
      category.count.textContent = `/ ${notesCount[key]} /`;
    }
  }

  updateTagListInPage(listTags) {
    if (!listTags) {
      console.log(`empty list`);
    }
    const tags = Array.from(listTags);
    const tagElementsList = [];

    tags.forEach((tag) => {
      const tagElement = this.#createTagElement(tag);
      tagElementsList.push(tagElement);
    });

    this.staticElements.tags.list.innerHTML = '';
    this.staticElements.tags.list.append(...tagElementsList);
  }

  #createTagElement(tag) {
    if (!tag) {
      return;
    }

    const tagElement = document.createElement(`li`);
    tagElement.classList.add(`tag-inline`, `sidebar-tag`);
    tagElement.dataset.name = `sidebarTag`;
    tagElement.dataset.tag = tag.id;
    tagElement.dataset.title = tag.title;
    tagElement.dataset.section = `tag`;

    tagElement.innerHTML = `
			<div class="tag-inline__title tag-inline__section" data-name="sidebarTagTitle">
				${tag.title}
			</div>

			<div class="button-icon menu-action menu-action-light tag-inline__section tag-inline__options" data-tag="${tag.id}" data-name="sidebarTagOptions">
				<span class="menu-action__span menu-action__dot"></span>
 				<span class="menu-action__span menu-action__dot"></span>
 				<span class="menu-action__span menu-action__dot"></span>
 			</div>
		`;
    return tagElement;
  }

  #createContextMenu(event) {
    const tagElement = event.target.closest('[data-name="sidebarTag"]');

    if (!tagElement) {
      return;
    }

    const tag = {
      id: tagElement.dataset.tag,
      title: tagElement.dataset.title,
    };

    const tagContextMenuBody = this.#createTagContextMenuTag(tag);

    this.contextMenu = new ContextMenu(
      this.element,
      tagElement,
      tagContextMenuBody,
      this.#onClickContextMenu.bind(this),
    );

    this.contextMenu.tag = tag;
    this.addOverlay();

    this.contextMenu.addElementToPage();
    this.contextMenu.positiongOnPage();
  }

  #deleteContextMenu() {
    if (!this.contextMenu) {
      return;
    }

    this.contextMenu.deleteElement();
    this.removeOverlay();
    this.contextMenu = null;
  }

  #createModal(tag) {
    if (this.modal) {
      this.#deleteModal();
    }

    this.modal = new ModalSidebarChangeTag(
      this.#onClickByModal.bind(this),
      tag,
      this.#onInputModalTagValue.bind(this),
    );
  }

  #deleteModal() {
    if (!this.modal) {
      return;
    }

    this.modal.deleteElement();
    this.modal = null;
  }

  #createTagContextMenuTag(tag) {
    const tagContextMenuElement = document.createElement(`aside`);
    tagContextMenuElement.classList.add(
      `context-menu`,
      `sidebar-tags__context-menu`,
    );
    tagContextMenuElement.dataset.tag = tag.id;
    tagContextMenuElement.innerHTML = `
			<ul class="context-menu__list sidebar-tags__context-menu-list">
				<li class="context-menu__item sidebar-tags__context-menu-remove" data-name="sidebarContextMenuItem" data-id="sidebarTagDelete">
					Удалить
				</li>

				<li class="context-menu__item sidebar-tags__context-menu-change" data-name="sidebarContextMenuItem" data-id="sidebarTagChange">
					Изменить
				</li>
			</ul>
		`;
    return tagContextMenuElement;
  }

  hideElement() {
    if (!this.element) {
      console.log(`empty element`);
      return;
    }

    this.element.classList.remove(`sidebar-main_show`);

    if (this.contextMenu) {
      this.#deleteContextMenu();
    }
  }

  showElement() {
    if (!this.element) {
      console.log(`empty element`);
      return;
    }

    this.element.classList.add(`sidebar-main_show`);
  }

  addOverlay() {
    if (!this.element) {
      console.log(`empty element`);
      return;
    }

    this.staticElements.container.classList.add(`section-overlay`);
  }

  removeOverlay() {
    if (!this.element) {
      console.log(`empty element`);
      return;
    }

    this.staticElements.container.classList.remove(`section-overlay`);
  }

  updateExistTags(tags) {
    this.existTags = tags;
  }

  #onClickContextMenu(event) {
    if (!event.target.closest(`.context-menu`)) {
      this.#deleteContextMenu();
      return;
    }

    const tagElement = event.target.closest(
      `[data-name="sidebarContextMenuItem"]`,
    );

    if (!tagElement) {
      return;
    }

    let action = null;

    switch (tagElement.dataset.id) {
      case `sidebarTagChange`:
        action = `change`;
        break;

      case `sidebarTagDelete`:
        action = `delete`;
        break;

      default:
        console.log(`unknown action`);
        return;
    }

    const tag = {
      action,
      id: this.contextMenu.tag.id,
      title: this.contextMenu.tag.title,
    };

    this.#createModal(tag);
    this.#deleteContextMenu();
  }

  #onClickByModal(event) {
    if (!event.target.closest(`[data-id="modalBody"]`)) {
      this.#deleteModal();
      return;
    }

    const button = event.target.closest(`[data-name="sidebarModalTagButton"]`);
    if (!button) {
      return;
    }

    if (button.dataset.id === 'sidebarModalTagCancel') {
      this.#deleteModal();
      return;
    }

    if (button.dataset.id === 'sidebarModalTagChange') {
      if (button.dataset.active === 'false') {
        return;
      }

      this.addDataToStream(`changeTag`, {
        tag: {
          id: this.modal.tag.id,
          title: this.modal.staticElements.tag.value.trim(),
        },
      });
      this.#deleteModal();
      return;
    }

    if (button.dataset.id === 'sidebarModalTagDelete') {
      this.addDataToStream(`deleteTag`, {
        tag: {
          id: this.modal.tag.id,
        },
      });
      this.#deleteModal();
      return;
    }
  }

  #onInputModalTagValue(event) {
    this.addDataToStream(`modalInputTagChange`, event.target);
  }

  #onClickByTagOptions(event) {
    event.stopPropagation();
    this.#createContextMenu(event);
  }

  #onClickByCategory(event) {
    const selectedElement = event.target.closest('[data-section]');

    const selectedData = {
      section: selectedElement.dataset.section,
      start: null,
      count: 10,
      end: null,
    };

    if (selectedElement.dataset.section === `tag`) {
      const targetTag = this.existTags.find(
        (tag) => tag.id === selectedElement.dataset.tag,
      );
      selectedData.tag = targetTag;
    }

    if (
      selectedElement.dataset.section === `notes` ||
      selectedElement.dataset.section === `files`
    ) {
      selectedData.category = selectedElement.dataset.category;
    }

    this.addDataToStream(`requestNotes`, selectedData);
  }

  async validateChangingTagTitle(token) {
    if (!this.modal) {
      return;
    }
    await this.modal.validateChangingTagTitle(token);
  }
}
