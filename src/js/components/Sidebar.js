import BaseComponent from '../helpers/BaseComponent'
import ContextMenu from './popups/ContextMenu';
import Modal from './popups/Modal';

import { sidebarStaticElements, routes, general } from '../consts/index.js'
import { Subject, merge, fromEvent, throttleTime, filter, map, debounceTime } from 'rxjs';

export default class Sidebar extends BaseComponent {
	constructor(container) {
		super(container);
		this.server = routes.server;
		this.pathTagValidate = routes.tag.validate;
		this.headers = {
   		'Content-Type': 'application/json;charset=utf-8'
  	}
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
			videos:	{
				container: null,
				count: null,
			},
			audios:	{
				container: null,
				count: null,
			},
			images:	{
				container: null,
				count: null,
			},
			otherFiles: {
				container: null,
				count: null,
			},
			tags: {
				list: null,
			},
		};
		this.modal = null;
		this.contextMenu = null;		
		this.abortControllers = {
			validateTagTitle: null,
		}
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
				<div class="sidebar-link-item sidebar-all-notes" data-section="notes" data-category="allNotes" data-id="sidebarAllNotes">
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
					<li class="sidebar-files sidebar-videos sidebar-link-item" data-section="files" data-category="videos" data-id="sidebarVideos">
						<span class="sidebar-link-item__name sidebar-video__name" data-id="sidebarVideosTitle">
								${sidebarStaticElements.files.videos.description}
						</span>
						<span class="sidebar-link-item__count sidebar-video__count" data-id="sidebarVideosCount">
							
						</span>
					</li>
							
					<li class="sidebar-files sidebar-audios sidebar-link-item" data-section="files" data-category="audios" data-id="sidebarAudios">
						<span class="sidebar-link-item__name sidebar-audio__name" data-id="sidebarAudiosTitle">
								${sidebarStaticElements.files.audios.description}
						</span>
						<span class="sidebar-link-item__count sidebar-audio__count" data-id="sidebarAudiosCount">
							
						</span>
					</li>
						
					<li class="sidebar-files sidebar-images sidebar-link-item" data-section="files" data-category="images" data-id="sidebarImages">
						<span class="sidebar-link-item__name sidebar-image__name" data-id="sidebarImagesTitle">
								${sidebarStaticElements.files.images.description}
						</span>
						<span class="sidebar-link-item__count sidebar-image__count" data-id="sidebarImagesCount">
							
						</span>
					</li>
							
					<li class="sidebar-files sidebar-other-files sidebar-link-item" data-section="files" data-category="otherFiles" data-id="sidebarOtherFiles">
						<span class="sidebar-link-item__name sidebar-other-files__name" data-id="sidebarOtherFilesTitle">
								${sidebarStaticElements.files.otherFiles.description}
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
		`
	}

	#saveStaticElements() {
		if(!this.element) {
			console.log(`empty element`);
			return;
		}

		this.staticElements.container = this.element.querySelector('.sidebar-main-container');

		this.staticElements.allNotes.container = this.element.querySelector(`[data-id="sidebarAllNotes"]`)
		this.staticElements.allNotes.count = this.element.querySelector(`[data-id="sidebarAllNotesCount"]`)

		this.staticElements.favorites.container = this.element.querySelector(`[data-id="sidebarFavorites"]`)
		this.staticElements.favorites.count = this.element.querySelector(`[data-id="sidebarFavoritesCount"]`)
					
		this.staticElements.videos.container = this.element.querySelector(`[data-id="sidebarVideos"]`)
		this.staticElements.videos.count = this.element.querySelector(`[data-id="sidebarVideosCount"]`)
					
		this.staticElements.audios.container = this.element.querySelector(`[data-id="sidebarAudios"]`)
		this.staticElements.audios.count = this.element.querySelector(`[data-id="sidebarAudiosCount"]`)
					
		this.staticElements.images.container = this.element.querySelector(`[data-id="sidebarImages"]`)
		this.staticElements.images.count = this.element.querySelector(`[data-id="sidebarImagesCount"]`)
			
		this.staticElements.otherFiles.container = this.element.querySelector(`[data-id="sidebarOtherFiles"]`)
		this.staticElements.otherFiles.count = this.element.querySelector(`[data-id="sidebarOtherFilesCount"]`)
					
		this.staticElements.tags.list = this.element.querySelector(`[data-id="sidebarTagsList"]`)
	}

	#createStreams() {
		this.saveStream(`requestNotes`, new Subject());
		this.saveStream(`deleteTag`, new Subject());
		this.saveStream(`changeTag`, new Subject());
		
		const modalInputTagChange = new Subject().pipe(
			debounceTime(350)
		);
		this.saveStream(`modalInputTagChange`, modalInputTagChange);
		
		const clicksOnCategory = merge(
			fromEvent(this.staticElements.allNotes.container, `click`),
			fromEvent(this.staticElements.favorites.container, `click`),
			fromEvent(this.staticElements.videos.container, `click`),
			fromEvent(this.staticElements.audios.container, `click`),
			fromEvent(this.staticElements.images.container, `click`),
			fromEvent(this.staticElements.otherFiles.container, `click`)
		).pipe(
			throttleTime(350)
		);
		this.saveStream(`clicksOnCategory`, clicksOnCategory)

		const clicksOnTagTitle = fromEvent(this.staticElements.tags.list, `click`).pipe(
			filter(item => item.target.closest(`[data-name="sidebarTagTitle"]`)),
			throttleTime(350)
		);
		this.saveStream(`clicksOnTagTitle`, clicksOnTagTitle);

		const clicksOnTagOptions = fromEvent(this.staticElements.tags.list, `click`).pipe(
			filter(item => item.target.closest(`[data-name="sidebarTagOptions"]`)),
			throttleTime(350)
		);
		this.saveStream(`clicksOnTagOptions`, clicksOnTagOptions);
	}

	#subscribeToStreams() {
		this.subscribeToStream(`clicksOnTagOptions`, this.#onClickByTagOptions.bind(this));
		this.subscribeToStream(`clicksOnCategory`, this.#onClickByCategory.bind(this));
		this.subscribeToStream(`clicksOnTagTitle`, this.#onClickByCategory.bind(this));
	}


	updateCountNotesInCategory(categoriesList) {
		if(!categoriesList) {
			console.log(`empty element`)
		}

		for(let key in categoriesList) {
			const category = this.staticElements[key];
			category.count.textContent = `${categoriesList[key]}`
		}
	}
	
	updateTagListInPage(listTags) {
		if(!listTags) {
			console.log(`empty list`)
		}
		const tags = Array.from(listTags)
		const tagElementsList = []

		tags.forEach(tag => {
			const tagElement = this.#createTagElement(tag);
			tagElementsList.push(tagElement);
		})

		this.staticElements.tags.list.innerHTML = '';
		this.staticElements.tags.list.append(...tagElementsList);
	}

	#createTagElement(tag) {
		if(!tag) {
			console.log(`empty tag`)
			return;
		}

		const tagElement = document.createElement(`li`);
		tagElement.classList.add(`tag-inline`, `sidebar-tag`)
		tagElement.dataset.name = `sidebarTag`;
		tagElement.dataset.tag = tag.id;
		tagElement.dataset.title = tag.title;
		tagElement.dataset.section = `tag`

		tagElement.innerHTML = `
			<div class="tag-inline__title tag-inline__section" data-name="sidebarTagTitle">
				${tag.title}
			</div>

			<div class="button-icon menu-action menu-action-light tag-inline__section tag-inline__options" data-tag="${tag.id}" data-name="sidebarTagOptions">
				<span class="menu-action__span menu-action__dot"></span>
 				<span class="menu-action__span menu-action__dot"></span>
 				<span class="menu-action__span menu-action__dot"></span>
 			</div>
		`
		return tagElement;				
	}

	#createContextMenu(event) {
		const tagElement = event.target.closest('[data-name="sidebarTag"]');		

		if(!tagElement) {
			console.log(`empty element`);
			return;
		}

		const tag = {
			id: tagElement.dataset.tag,
			title: tagElement.dataset.title
		}

		const tagContextMenuBody = this.#createTagContextMenuTag(tag);

		this.contextMenu = new ContextMenu(
			this.element, 
			tagElement, 
			tagContextMenuBody, 
			this.#onClickContextMenu.bind(this)
		);

		this.contextMenu.tag = tag;
		this.addOverlay();

		this.contextMenu.addElementToPage();
		this.contextMenu.positiongOnPage();

	}

	#deleteContextMenu() {
		if(!this.contextMenu) {
			console.log(`empty element`);
			return;
		}

		this.contextMenu.deleteElement();
		this.removeOverlay();
		this.contextMenu = null;
	}

	#createModal(tag) {
		if(!tag) {
			console.log(`empty element`);
			return;
		}

		const bodyModal = this.#createModalTagBody(tag);	
		this.modal = new Modal(bodyModal, this.#onClickByModal.bind(this))		;

		this.modal.tag = tag;
		this.modal.cancel = this.modal.element.querySelector(`[data-id="sidebarModalTagCancel"]`);

		if(tag.action === `delete`) {
			this.modal.delete = this.modal.element.querySelector(`[data-id="sidebarModalTagDelete"]`);
		}

		if(tag.action === `change`) {
			this.modal.change = this.modal.element.querySelector(`[data-id="sidebarModalTagChange"]`);
			this.modal.input = this.modal.element.querySelector(`[data-id="sidebarModalInput"]`);
			this.modal.input.focus();
			this.modal.input.setSelectionRange(this.modal.input.value.length, this.modal.input.value.length);
		}
		this.modal.addElementToPage();

		if(tag.action === `change`) {
			this.modal.input.focus()
		}
	}

	#deleteModal() {
		if(!this.modal) {
			console.log(`empty element`);
			return;
		}

		this.modal.element.remove();
		this.modal = null;
	}

	#createModalTagBody(tag) {
		let modalTagTitle = null; 
		let modalTagBody = null; 
		let modalButtonConfirm = null;

		const modalElement = document.createElement(`aside`);
		modalElement.classList.add(`modal__overlay`, `sidebar-modal`)

		if(tag.action === `change`) {
			modalTagTitle = `Изменить тег?`;
			modalTagBody = `
				<input type="text" class="modal__input sidebar-modal__input" value="${tag.title}" data-id="sidebarModalInput" data-tag-id=${tag.id} data-tag-title="${tag.title}">
			`;
			modalButtonConfirm =  `
				<button class="button sidebar-modal__button sidebar-modal__remove sidebar-modal__button_inactive" data-name="sidebarModalTagButton" data-id="sidebarModalTagChange" data-active="false">
					Сохранить
				</button>
			`;
		}

		if(tag.action === `delete`) {
			modalTagTitle = `Удалить тег?`;
			modalTagBody = `
				<div class="sidebar-modal__description">
					 ${tag.title}
				</div>
			`;
			modalButtonConfirm = `
				<button class="button sidebar-modal__button sidebar-modal__remove" data-name="sidebarModalTagButton" data-id="sidebarModalTagDelete">
					Удалить
				</button>
			`;
		}		
	
		modalElement.innerHTML = `
			<article class="modal__body sidebar-modal__body" data-id="modalBody">
				<h2 class="modal__title sidebar-modal__title">
					${modalTagTitle}
				</h2>

				${modalTagBody}
				
				<div class="modal__buttons sidebar-modal__buttons">
					<button class="button sidebar-modal__button" data-name="sidebarModalTagButton" data-id="sidebarModalTagCancel">
						Отмена
					</button>
				
					${modalButtonConfirm}

		 		</div>
			</article>
		`;

		return modalElement;
	}

	#createTagContextMenuTag(tag) {
		const tagContextMenuElement = document.createElement(`aside`);
		tagContextMenuElement.classList.add(`context-menu`, `sidebar-tags__context-menu`);
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
		`
		return tagContextMenuElement;
	}


	#createStreamsModal() {
		if(this.modal.tag.action === `change`) {
			const inputOnModal = fromEvent(this.modal.input, `input`);
			this.modal.saveStream(`inputOnModal`, inputOnModal);
		}
	}

	#subscribeToStreamsModal() {
		if(this.modal.tag.action === `change`) {
			this.modal.subscribeToStream(`inputOnModal`, this.#onInputModalTagValue.bind(this));	
		}
	}


	hideElement() {
		if(!this.element) {
			console.log(`empty element`);
			return;
		}

		this.element.classList.remove(`sidebar-main_show`);

		if(this.contextMenu) {
			this.#deleteContextMenu()
		}
	}

	showElement() {
		if(!this.element) {
			console.log(`empty element`);
			return;
		}
		
		this.element.classList.add(`sidebar-main_show`)
	}

	addOverlay() {
		if(!this.element) {
			console.log(`empty element`);
			return;
		}
		
		this.staticElements.container.classList.add(`section-overlay`)
	}

	removeOverlay() {
		if(!this.element) {
			console.log(`empty element`);
			return;
		}
		
		this.staticElements.container.classList.remove(`section-overlay`)
	}

	#onClickContextMenu(event) {
		if(!event.target.closest(`.context-menu`)) {
			this.#deleteContextMenu();
			return;
		}

		const tagElement = event.target.closest(`[data-name="sidebarContextMenuItem"]`);

		if(!tagElement) {
			return;
		}

		let action = null;

		switch(tagElement.dataset.id) {
			case `sidebarTagChange`:
				action = `change`;
				break;

			case `sidebarTagDelete`:
				action = `delete`;
				break;

			default:
				console.log(`unknown action`)
				return
		}

		const tag = {
			action,
			id: this.contextMenu.tag.id,
			title: this.contextMenu.tag.title
		}

		this.#createModal(tag); 
		this.#deleteContextMenu();

		this.#createStreamsModal();
		this.#subscribeToStreamsModal()
	}

	#onClickByModal(event) {
		if(!event.target.closest(`[data-id="modalBody"]`)) {
			this.#deleteModal();
			return;
		}

		const button = event.target.closest(`[data-name="sidebarModalTagButton"]`)
		if(!button) {
			return;
		}
	
		if(button.dataset.id === "sidebarModalTagCancel") {
			this.#deleteModal();
			return;
		}

		if(button.dataset.id === "sidebarModalTagChange") {
			if(button.dataset.active === "false") {
				return;
			}
			this.addDataToStream(`changeTag`, this.modal.tag)
			this.#deleteModal();
			return;
		}

		if(button.dataset.id === "sidebarModalTagDelete") {
			this.addDataToStream(`deleteTag`, this.modal.tag)
			this.#deleteModal();
			return;
		}
	}

	#onInputModalTagValue(event) {
		this.addDataToStream(`modalInputTagChange`, event.target)
	}

	#enableModalTagChangeButton() {
		if(!this.modal?.change) {
			console.log(`empty element`);
			return;
		}

		this.modal.change.dataset.active = true;
		this.modal.change.classList.remove(`sidebar-modal__button_inactive`);
		this.modal.input.classList.add(`input-value_good`);
		this.modal.input.classList.remove(`input-value_bad`);
	}

	#disableModalTagChangeButton() {
		if(!this.modal?.change) {
			console.log(`empty element`);
			return;
		}

		this.modal.change.dataset.active = false;
		this.modal.change.classList.add(`sidebar-modal__button_inactive`);

		this.modal.input.classList.add(`input-value_bad`);
		this.modal.input.classList.remove(`input-value_good`);
	}

	#onClickByTagOptions(event) {
		event.stopPropagation()
		this.#createContextMenu(event);
	}

	#onClickByCategory(event) {
		const selectedElement = event.target.closest('[data-section]')

		const selectedData = {
			section: selectedElement.dataset.section,
			start: null,
			end: null,
		}

		if(selectedElement.dataset.section === `tag`) {
			selectedData.tag = selectedElement.dataset.tag
		}

		if(selectedElement.dataset.section === `notes` || selectedElement.dataset.section === `files`) {
			selectedData.category = selectedElement.dataset.category
		}

		this.addDataToStream(`requestNotes`, selectedData);
	}

	async validateChangingTagTitle(token) {
		const tagId = this.modal.input.dataset.tagId;
		const tagTitle = this.modal.input.value.trim();
		const tagOldTitle = this.modal.input.dataset.tagTitle;

		if(!tagId) {
			console.log(`empty tag`);
			return;
		}
		
		this.#disableModalTagChangeButton();

		if(!tagTitle || (tagTitle === tagOldTitle)) {
			return;
		}

		try {
			this.#addAwaitingModalTagChangeButton()

			if(this.abortControllers.validateTagTitle) {
				this.abortControllers.validateTagTitle.abort();
				this.abortControllers.validateTagTitle = null;
			}

			this.abortControllers.validateTagTitle = new AbortController();

			const requestUrl = `${this.server}${this.pathTagValidate}`;
			const requestBody = JSON.stringify({
				token,
				tag: {
					id: tagId,
					title: tagTitle,
				}
			});
			const requestOptions = {
				headers: this.headers,
				method: `POST`,
				body: requestBody,
				signal: this.abortControllers.validateTagTitle.signal,
			}

			const responseFromServerJSON = await fetch(requestUrl, requestOptions);

			if(!responseFromServerJSON.ok) {
				throw(`Сервер ответил с ошибкой`);
			}

			this.abortControllers.validateEmail = null;
			
			const responseFromServer = await responseFromServerJSON.json();

			if(responseFromServer.success) {
				this.#enableModalTagChangeButton();
			}

		} catch (err) {
			console.log(`Сервер недоступен: ${err}`);

		} finally {
			this.#removeAwaitingModalTagChangeButton()
		}
	}

	#addAwaitingModalTagChangeButton() {
		this.modal.change.classList.add(`gradient-background_awaiting-response`);
	}

	#removeAwaitingModalTagChangeButton() {
		this.modal.change.classList.remove(`gradient-background_awaiting-response`);
	}

}

