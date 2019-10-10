import Layout from './Layout.js';

export default class Column extends Layout {

	constructor() {
		super();
		
		this.resizableRow = true;
		this.resizableColumn = false;
	}

	connectedCallback() {
		this.resizable();
	}

	slotChangeCallback() {
		if(this.children.length === 0) {
			this.remove();
		}
		
		super.slotChangeCallback();
	}

}

customElements.define("gyro-layout-column", Column);
