import Streams from './Streams';

export default class PageComponent extends Streams {
  constructor(container) {
    super();
    this.element = null;
    this.container = container;
    this.staticElements = {};
  }

  addElementToPage() {
    if (!this.element) {
      console.log(`empty element`);
      return;
    }

    this.container.append(this.element);
  }

  removeElementFromPage() {
    if (!this.element) {
      console.log(`empty element`);
      return;
    }

    this.element.remove();
  }

  deleteElement() {
    if (!this.element) {
      console.log(`empty element`);
      return;
    }

    this.removeElementFromPage();

    for (let key in this.streams) {
      this.clearSubscriptionsStream(key);
    }

    this.element = null;
  }

  disableScrolling() {
    if (!this.element) {
      console.log(`empty element`);
      return;
    }
    // this.addRightPadding()
    this.element.classList.add(`no-scroll`);
  }

  enableScrolling() {
    if (!this.element) {
      console.log(`empty element`);
      return;
    }
    // this.removeRightPadding()
    this.element.classList.remove(`no-scroll`);
  }

  hideElement() {
    if (!this.element) {
      console.log(`empty element`);
      return;
    }

    this.element.classList.add('hidden-item');
  }

  addRightPadding() {
    const div = document.createElement('div');
    div.style.overflowY = 'scroll';
    div.style.width = '50px';
    div.style.height = '50px';

    document.body.append(div);
    const scrollWidth = div.offsetWidth - div.clientWidth;

    div.remove();

    const elemenrStyle = getComputedStyle(this.element);
    const oldRightPadding = elemenrStyle['padding-right'] || 0;
    const oldRightPaddingInt = parseInt(oldRightPadding, 10);
    const newRightPadding = scrollWidth + oldRightPaddingInt;

    this.element.style.paddingRight = `${newRightPadding}px`;
  }

  removeRightPadding() {
    const div = document.createElement('div');
    div.style.overflowY = 'scroll';
    div.style.width = '50px';
    div.style.height = '50px';

    document.body.append(div);
    const scrollWidth = div.offsetWidth - div.clientWidth;

    div.remove();

    const elemenrStyle = getComputedStyle(this.element);
    const oldRightPadding = elemenrStyle['padding-right'] || 0;
    const oldRightPaddingInt = parseInt(oldRightPadding, 10);
    const newRightPadding = scrollWidth - oldRightPaddingInt;

    this.element.style.paddingRight = `${newRightPadding}px`;
  }

  showElement() {
    if (!this.element) {
      console.log(`empty element`);
      return;
    }

    this.element.classList.remove('hidden-item');
  }

  addOverlay() {
    if (!this.element) {
      console.log(`empty element`);
      return;
    }
    this.element.dataset.overlay = true;
    this.element.classList.add('section-overlay');
  }

  removeOverlay() {
    if (!this.element) {
      console.log(`empty element`);
      return;
    }

    this.element.dataset.overlay = false;
    this.element.classList.remove('section-overlay');
  }
}
