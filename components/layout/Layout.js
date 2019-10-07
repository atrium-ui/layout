import Group from './Group.js';
import Column from './Column.js';

class Layout extends HTMLElement {

	constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		this.shadowRoot.innerHTML = `
			<slot></slot>	
		`;

		this.currentWidth = this.clientWidth;
		this.currentHeight = this.clientHeight;

		this.preventResizeEvent = false;
		
		window.addEventListener('resize', () => this.layoutUpdate());
		window.addEventListener('layout', () => this.layoutUpdate());
	}

	connectedCallback() {
		this.layoutUpdate();
	}

	layoutUpdate() {
		if(this.preventResizeEvent) return;

		console.log('layout update');

		const factor = [
			this.clientWidth / this.currentWidth,
			this.clientHeight / this.currentHeight,
		];

		for(let c = 0; c < this.children.length; c++) {
			const child = this.children[c];

			if(child instanceof Column) {
				child.width = child.width * factor[0];
				child.height = child.height * factor[1];
	
				child.update();
			}
		}

		this.currentWidth = this.clientWidth;
		this.currentHeight = this.clientHeight;

		this.preventResizeEvent = true;
		window.dispatchEvent(new Event('resize'));
		window.dispatchEvent(new Event('layout'));
		this.preventResizeEvent = false;
	}

}

customElements.define("gyro-layout", Layout);
