import { Subject, fromEvent, map, filter, throttleTime } from 'rxjs';
import BaseComponent from '../helpers/BaseComponent';

export default class MiniSidebar extends BaseComponent {
  constructor(container) {
    super(container);
    this.staticElements = {
      slider: null,
    };
    this.streams = {
      clicksOnSlider: {
        subscriptions: new Set(),
        stream$: null,
      },
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
    this.element.classList.add('sidebar-mini');
    this.element.innerHTML = `
			<div class="button-icon sidebar-mini__item menu-action sidebar-mini__slider" data-id="sidebarSlider" data-name="sidebarMenu">
				<span class="menu-action__span menu-action__line">
				</span>

				<span class="menu-action__span menu-action__line">
				</span>
						
				<span class="menu-action__span menu-action__line">
				</span>
			</div>
		`;
  }

  #saveStaticElements() {
    if (!this.element) {
      console.log(`empty element`);
      return;
    }

    this.staticElements.slider = document.querySelector(
      `[data-id="sidebarSlider"]`,
    );
  }

  #createStreams() {
    const clicksOnSidebar = fromEvent(this.staticElements.slider, 'click').pipe(
      throttleTime(350),
    );
    this.saveStream(`clicksOnSidebar`, clicksOnSidebar);

    this.saveStream(`showSidebar`, new Subject());
  }

  #subscribeToStreams() {
    this.subscribeToStream(
      `clicksOnSidebar`,
      this.#onClickBySidebar.bind(this),
    );
  }

  #onClickBySidebar(event) {
    if (!event || !event.target) {
      console.log(`empty element`);
      return;
    }

    if (event.target.closest(`[data-id="sidebarSlider"]`)) {
      this.addDataToStream(`showSidebar`, event.target);
    }
  }
}
