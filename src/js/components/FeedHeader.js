import BaseComponent from '../helpers/BaseComponent'
import ContextMenu from './popups/ContextMenu';
import Modal from './popups/Modal';

import { fromEvent, throttleTime } from 'rxjs';

import { feedHeaderStaticElements } from '../consts/index.js'

export default class FeedHeader extends BaseComponent {
	constructor(container) {
		super(container);
		this.staticElements = {
			user: null,
			sign: null,
			category: null,
			network: null,
		}
	}

	initionRender() {
		this.#createElement();
		this.#saveStaticElements();
		this.addElementToPage();

		this.#createStreams()
		this.#subscribeToStreams()
	}
	
	#createElement() {
		this.element = document.createElement(`header`);
		this.element.classList.add(`feed-header`);
		this.element.innerHTML = `
			<div class="feed-header__block feed-account">
				<div class="feed-header__item feed-account__user" data-id="feedAccountUser">
				</div>
				
				<div class="feed-header__item feed-account__sign" data-id="feedAccountSign" data-auth="false">
					${feedHeaderStaticElements.auth.false}
				</div>	
			</div>

			<div class="feed-header__block feed-status">
				<div class="feed-header__item feed-status__category" data-id="feedStatusCategory">
				</div>
					
				<div class="feed-header__item feed-status__network feed-status__network_connecting" data-id="feedStatusNetwork" data-network="connecting">
					${feedHeaderStaticElements.network.connecting}					
				</div>
			</div>
		`
	}

	#saveStaticElements() {
		if(!this.element) {
			console.log(`empty element`);
			return;
		}

		this.staticElements.user = this.element.querySelector(`[data-id="feedAccountUser"]`)
		this.staticElements.sign = this.element.querySelector(`[data-id="feedAccountSign"]`)
		this.staticElements.category = this.element.querySelector(`[data-id="feedStatusCategory"]`)
		this.staticElements.network = this.element.querySelector(`[data-id="feedStatusNetwork"]`)
	}

	upgradeUser(user) {
		console.log(this)
		if(!user) {
			console.log(`empty request`);
			return;		
			}	

		this.staticElements.user.textContent = user.email;
	}

	upgradeSign(data) {
		if(!data) {
			console.log(`empty request`);
			return;
		}

		this.staticElements.sign.dataset.auth = data.auth;
		this.staticElements.sign.textContent = feedHeaderStaticElements.auth[data.auth];
	}

	upgradeCategory(category) {
		if(!category) {
			console.log(`empty request`);
			return;
		}	

		const text = category.type == `tag` ?
			`#${category.title}` :
			category.title

		this.staticElements.category.textContent = text;
	}

	upgradeNetwork(data) {
		if(!data) {
			console.log(`empty request`);
			return;
		}	

		this.staticElements.network.textContent = feedHeaderStaticElements.network[data.status];

		switch (data.status) {
			case `connecting`:
				this.staticElements.network.classList.add(`feed-status__network_connecting`);
				this.staticElements.network.classList.remove(`feed-status__network_offline`);
				break;

			case `online`:
				this.staticElements.network.classList.remove(`feed-status__network_connecting`);
				this.staticElements.network.classList.remove(`feed-status__network_offline`);
				break;

			case `offline`:
				this.staticElements.network.classList.remove(`feed-status__network_connecting`);
				this.staticElements.network.classList.add(`feed-status__network_offline`);
				break;
		}
	}

	#createStreams() {
		const clicksOnSign = fromEvent(this.staticElements.sign, `click`).pipe(
			throttleTime(350)
		)
		this.saveStream(`clicksOnSign`, clicksOnSign)
	}

	#subscribeToStreams() {
	}
}