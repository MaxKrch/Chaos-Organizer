import BaseComponent from '../../helpers/BaseComponent';

export default class Modal extends BaseComponent {
	constructor(container, element) {
		super(container);
		this.element = element;
	}
}