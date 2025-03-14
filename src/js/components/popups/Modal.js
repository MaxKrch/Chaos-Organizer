import BaseComponent from '../../helpers/BaseComponent';
import { merge, fromEvent, throttleTime } from 'rxjs';

import { general } from '../../consts/index.js';

export default class Modal extends BaseComponent {
  constructor(body, subscriber) {
    super(document.querySelector(`[data-app-id="${general.appId}"]`));
    this.element = body;

    this.#createClicksStream(subscriber);
  }

  #createClicksStream(subscriber) {
    if (subscriber) {
      this.container = document.querySelector(
        `[data-app-id="${general.appId}"]`,
      );

      const clicksStream = fromEvent(this.container, `click`).pipe(
        throttleTime(350),
      );
      this.saveStream(`clicksStream`, clicksStream);
      this.subscribeToStream(`clicksStream`, subscriber);
    }
  }
}
