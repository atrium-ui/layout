export default class Column extends HTMLElement {

	constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		const slot = document.createElement('slot');
		this.shadowRoot.appendChild(slot);

		slot.addEventListener("slotchange", e => {
			this.update();
		
			if(this.children.length === 0) {
				this.remove();
	
				window.dispatchEvent(new Event('layout'));
			}
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

}

customElements.define("gyro-layout-column", Column);
