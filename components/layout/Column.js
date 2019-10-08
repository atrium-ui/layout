import Layout from './Layout.js';

export default class Column extends Layout {

	constructor() {
		super();

		this.shadowSlot.addEventListener("slotchange", e => {
			this.update();
			this.slotChangeCallback();
		});

		window.addEventListener('layout', () => {
			this.update();
		});

		this.update();
	}

	update() {
		this.boundingBox = this.getBoundingClientRect();

		this.width = this.boundingBox.width;
		this.height = this.boundingBox.height;
	}

	slotChangeCallback() {
		if(this.children.length === 0) {
			this.remove();
			window.dispatchEvent(new Event('layout'));
		}
	}

	resizable() {
		
	}

	layoutUpdate() {
		// if(this.preventResizeEvent) return;

		// const availableHeight = this.clientHeight;
		// const columns = this.childElements;
		// const columnTemplate = [];

		// for(let column of columns) {
		// 	const fraction = (column.height / availableHeight) * columns.length;
		// 	column.height = availableHeight * fraction;
		// 	columnTemplate.push(fraction);

		// 	column.update();
		// }

		// this.setLayoutTempalte(columnTemplate);
	}

	setLayoutTempalte(columnTemplate) {
		// this.style.gridTemplateRows = columnTemplate.map(n => n.toFixed(4) + "fr").join(" ");
	}

}

customElements.define("gyro-layout-column", Column);
