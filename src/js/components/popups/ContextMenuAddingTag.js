import ContextMenu from './ContextMenu';
import { Subject, fromEvent, debounceTime, filter, } from 'rxjs';

export default class ContextMenuAddingTag extends ContextMenu {
	constructor(container, parent, subscriberForAction, tags) {
		super(container, parent, null, null);
		this.tags = tags;
		this.staticElements = {
			inputNewTag: null,
			saveNewTag: null,
		}
		this.#initElement(subscriberForAction);
	}

	#initElement(subscriberForAction) {
		this.#renderElement();
		this.#saveStaticElements()
		this.#createStreams();
		this.#subscribeToStreams(subscriberForAction);
	}

	#renderElement() {
		this.element = document.createElement(`aside`);
		this.element.classList.add(`context-menu`, `note-add-tags`);
		this.element.dataset.id = "contextMenuBody";

		const elementsMenu = []

		const backElement = this.#renderBackElement();
		elementsMenu.push(backElement);

		const tagListElement = this.#renderTagListElement();
		if(tagListElement) {
			elementsMenu.push(tagListElement);
		}

		const newTagElement = this.#renderNewTagElement();
		elementsMenu.push(newTagElement);
		
		this.element.append(...elementsMenu);
	}

	#renderBackElement() {
		const backElement = document.createElement(`div`);
		backElement.classList.add(`note-add-tags__back`);
		backElement.dataset.targetAction = `closeContextMenu`;
		backElement.innerHTML = `
			<div class="note-add-tags__back-container">
				<span class="button-iconnote-add-tags__back note-add-tags__back-icon">
				</span>
							
				<span class="note-add-tags__backnote-add-tags__back-text">
					Назад
				</span>
			</div>
		`
		return backElement;
	}

	#renderTagListElement() {
		const tagListElement = document.createElement(`ul`);
		tagListElement.classList.add(`context-menu__list`, `tags-column`, `note-add-tags__list`);

		const tagElements = [];
		this.tags.exist.forEach(tag => {
			if(!this.tags.note || (this.tags.note.findIndex(item => item.id === tag.id) < 0)) {
				const newTagElement = this.#createTagElement(tag);
				tagElements.push(newTagElement);
			}
		})

		if(tagElements.length === 0) {
			return null;
		}

		tagListElement.append(...tagElements)
		return tagListElement;
	}

	#renderNewTagElement() {
		const newTagElement = document.createElement(`div`);
		newTagElement.classList.add(`tags-new`, `tags-column-new`);
		newTagElement.dataset.id = `createNewTag`;
		newTagElement.innerHTML = `
			<input type="text" class="tags-new__input" placeholder="Новый тег" data-id="newTagInput">
							
			<div class="figure-button tags-new__save tags-new__save_inactive" data-id="newTagSave" data-target-action="addNewTagToNote" data-active="false">
				<div class="figure-button__item figure-button__chek tags-new__save-chek">
				</div>
			</div>
		`
		return newTagElement;
	}

	#createTagElement(tag) {
		const tagElement = document.createElement(`li`);
		tagElement.classList.add(`context-menu__item`, `tag-block`, `note__add-tag`);
		tagElement.dataset.targetAction = `addExistTagToNote`;
		tagElement.dataset.tagId = tag.id;
		tagElement.textContent = tag.title;

		return tagElement;
	}

	#saveStaticElements() {
		this.staticElements.inputNewTag = this.element.querySelector(`[data-id="newTagInput"]`);
		this.staticElements.saveNewTag = this.element.querySelector(`[data-id="newTagSave"]`);
	}

	#createStreams() {
		this.saveStream(`requestAction`, new Subject());

		const inputNewTag = fromEvent(this.staticElements.inputNewTag, `input`).pipe(
			debounceTime(150),
		)
		this.saveStream(`inputNewTag`, inputNewTag);

		const pressEnterNewTag = fromEvent(this.staticElements.inputNewTag, `keypress`).pipe(
			filter(event => {
				if(event.key === 'Enter' && event.shiftKey === false) {
					return true;
				}
			})
		)
		this.saveStream(`pressEnterNewTag`, pressEnterNewTag);
	}

	#subscribeToStreams(subscriberForAction) {
		this.subscribeToStream(`requestAction`, subscriberForAction);
		this.subscribeToStream(`inputNewTag`, this.#chekAvailableNewTag.bind(this));		
		this.subscribeToStream(`pressEnterNewTag`, this.#onPressEnterNewTag.bind(this));
		this.subscribeToStream(`clicksStream`, this.#onClickByContextMenu.bind(this));
	}

	#chekAvailableNewTag(event) {
		const newTag = this.staticElements.inputNewTag.value.trim();

		if(newTag.length < 3) {
			this.#deActivationNewTagSaveButton();
			return;
		}

		const isExistTag = this.tags.exist.findIndex(item => item.title === newTag);
		
		if(isExistTag >= 0) {
			this.#deActivationNewTagSaveButton();
			return;
		}

		this.#activationNewTagSaveButton();
	}

	#activationNewTagSaveButton() {
		this.staticElements.saveNewTag.classList.remove(`tags-new__save_inactive`);
		this.staticElements.saveNewTag.dataset.active = true;
	}

	#deActivationNewTagSaveButton() {
		this.staticElements.saveNewTag.classList.add(`tags-new__save_inactive`);
		this.staticElements.saveNewTag.dataset.active = false;
	}

	#onPressEnterNewTag() {
		this.staticElements.saveNewTag.dispatchEvent(new MouseEvent(`click`, {
			bubbles: true,
		}))
	}

	#onClickByContextMenu(event) {
		if(!event.target.closest(`[data-id="contextMenuBody"]`)) {
			this.addDataToStream(`requestAction`, {
				action: `closeContextMenu`,
			});
			return;
		}

		const targetElement = event.target.closest(`[data-target-action]`);

		if(!targetElement) {
			return;
		}

		const targetAction = targetElement.dataset.targetAction;

		switch(targetAction) {
			case `closeContextMenu`:
				this.addDataToStream(`requestAction`, {
					action: `closeContextMenu`,
				});
				break;

			case `addExistTagToNote`:
				this.addDataToStream(`requestAction`, {
					action: `addTagToNote`,
					tag: {
						id: targetElement.dataset.tagId,
						title: targetElement.textContent
					},
				});
				break;

			case `addNewTagToNote`:
				if(targetElement.dataset.active !== `true`) {
					return;
				}
				
				const tag = {
					title: this.staticElements.inputNewTag.value.trim(),
					new: true,
				}

				this.addDataToStream(`requestAction`, {
					action: `addTagToNote`,
					tag,
				});
		
				break;
		}	
	}
}