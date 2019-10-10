import Panel from './Panel.js';

export default class Column extends Panel {

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
