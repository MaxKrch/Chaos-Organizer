import BaseComponent from '../helpers/BaseComponent';
import ContextMenu from './popups/ContextMenu';
import Modal from './popups/Modal';

import { fromEvent, throttleTime, filter, Subject } from 'rxjs';

import { feedHeaderStaticElements, routes } from '../consts/index.js';

export default class FeedHeader extends BaseComponent {
  constructor(container) {
    super(container);
    this.categories = routes.categories;
    this.staticElements = {
      account: null,
      user: null,
      sign: null,
      status: null,
      category: null,
      network: null,
    };
  }

  initionRender() {
    this.#createElement();
    this.#saveStaticElements();
    this.addElementToPage();

    this.#createStreams();
    this.#subscribeToStreams();
  }

  #createElement() {
    this.element = document.createElement(`header`);
    this.element.classList.add(`feed-header`);
    this.element.innerHTML = `
			<div class="feed-header__block feed-account" data-id="feedAccount">
				<div class="feed-header__item feed-account__user" data-id="feedAccountUser">
				</div>
				
				<div class="feed-header__item feed-account__sign not-selected" data-id="feedAccountSign" data-auth="false" data-active-button="true">
					${feedHeaderStaticElements.auth.false}
				</div>	
			</div>

			<div class="feed-header__block feed-status" data-id="feedStatus">
				<div class="feed-header__item feed-status__category" data-id="feedStatusCategory">
				</div>
					
				<div class="feed-header__item feed-status__network feed-status__network_connecting" data-id="feedStatusNetwork" data-network="connecting">
					${feedHeaderStaticElements.network.connecting}					
				</div>
			</div>
		`;
  }

  #saveStaticElements() {
    if (!this.element) {
      console.log(`empty element`);
      return;
    }

    this.staticElements.account = this.element.querySelector(
      `[data-id="feedAccount"]`,
    );
    this.staticElements.user = this.element.querySelector(
      `[data-id="feedAccountUser"]`,
    );
    this.staticElements.sign = this.element.querySelector(
      `[data-id="feedAccountSign"]`,
    );

    this.staticElements.status = this.element.querySelector(
      `[data-id="feedStatus"]`,
    );
    this.staticElements.category = this.element.querySelector(
      `[data-id="feedStatusCategory"]`,
    );
    this.staticElements.network = this.element.querySelector(
      `[data-id="feedStatusNetwork"]`,
    );
  }

  setUser(user) {
    if (!user) {
      console.log(`empty request`);
      return;
    }

    if (!user.email || !user.auth) {
      this.staticElements.user.textContent = ``;

      this.staticElements.sign.dataset.auth = false;
      this.staticElements.sign.textContent =
        feedHeaderStaticElements.auth[false];
      return;
    }

    this.staticElements.user.textContent = user.email;

    this.staticElements.sign.dataset.auth = user.auth;
    this.staticElements.sign.textContent =
      feedHeaderStaticElements.auth[user.auth];
  }

  setCategory(location) {
    if (!location) {
      console.log(`empty request`);
      return;
    }

    switch (location.section) {
      case `tag`:
        this.staticElements.category.textContent = `#${location.tag?.title}`;
        break;

      default:
        this.staticElements.category.textContent =
          this.categories[location.section][location.category].title;
    }
  }

  setNetworkStatus(network) {
    if (!network) {
      console.log(`empty request`);
      return;
    }

    this.staticElements.network.textContent =
      feedHeaderStaticElements.network[network];

    switch (network) {
      case `connecting`:
        this.staticElements.network.classList.add(
          `feed-status__network_connecting`,
        );
        this.staticElements.network.classList.remove(
          `feed-status__network_offline`,
        );
        break;

      case `online`:
        this.staticElements.network.classList.remove(
          `feed-status__network_connecting`,
        );
        this.staticElements.network.classList.remove(
          `feed-status__network_offline`,
        );
        break;

      case `offline`:
        this.staticElements.network.classList.remove(
          `feed-status__network_connecting`,
        );
        this.staticElements.network.classList.add(
          `feed-status__network_offline`,
        );
        break;
    }
  }

  #createStreams() {
    this.saveStream(`requestLogout`, new Subject());
    this.saveStream(`requestLogin`, new Subject());

    const clicksOnSign = fromEvent(this.staticElements.sign, `click`).pipe(
      throttleTime(350),
      filter((value) => value.target.dataset.activeButton === `true`),
    );
    this.saveStream(`clicksOnSign`, clicksOnSign);
  }

  #subscribeToStreams() {
    this.subscribeToStream(
      `clicksOnSign`,
      this.#onClickBySignButton.bind(this),
    );
  }

  addAwaitingStateAccount() {
    this.staticElements.account.classList.add(
      `gradient-background_awaiting-response`,
    );
    this.staticElements.sign.dataset.activeButton = `false`;
  }

  removeAwaitingStateAccount() {
    this.staticElements.account.classList.remove(
      `gradient-background_awaiting-response`,
    );
    this.staticElements.sign.dataset.activeButton = `true`;
  }

  addAwaitingStatusSection() {
    this.staticElements.status.classList.add(
      `gradient-background_awaiting-response-white`,
    );
  }

  removeAwaitingStatusSection() {
    this.staticElements.status.classList.remove(
      `gradient-background_awaiting-response-white`,
    );
  }

  #onClickBySignButton(event) {
    if (!event) {
      console.log(`empty event`);
      return;
    }

    const action =
      event.target.dataset.auth === 'true'
        ? this.addDataToStream(`requestLogout`, `logout`)
        : this.addDataToStream(`requestLogin`, `login`);
  }
}
