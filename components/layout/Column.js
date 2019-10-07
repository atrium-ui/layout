export default class Column extends HTMLElement {

	constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		const slot = document.createElement('slot');
		this.shadowRoot.appendChild(slot);

		this.boundingBox = this.getBoundingClientRect();

		slot.addEventListener("slotchange", e => {
			this.update();
		});

		window.addEventListener('layout', () => {
			this.update();
		});

		const splitBar = document.createElement('div');
		splitBar.className = "split-bar";

		let start = null;
		let resizing = false;

		window.addEventListener('pointermove', e => {
			const bounds = this.boundingBox;
			const x = e.x;

			const borderWidth = 4;

			let resize = false;
			let valid = false;

			const children = [...this.parentNode.children].filter(ele => ele instanceof Column);
			const curr = children.indexOf(this);

			if(curr >= 0 && children.length > curr) {
				const neighbor = children[curr+1];

				if(neighbor) {
					if(start) {
						const deltaX = e.movementX;

						this.width += deltaX;
						this.update();
						
						neighbor.width -= deltaX;
						neighbor.update();
					}

					valid = true;
				}
			}

			if(x > bounds.right - borderWidth && x < bounds.right + borderWidth) {
				resize = true;
			}

			if(resize && valid) {
				if(!splitBar.parentNode) {
					this.parentNode.appendChild(splitBar);
				}
			}

			if(splitBar.parentNode) {
				let borderX = bounds.x + bounds.width;

				if(start) {
					borderX += e.movementX;
				}

				splitBar.style.setProperty('--x', borderX);
				splitBar.style.setProperty('--w', borderWidth);

				if(!start && !resize) {
					splitBar.parentNode.removeChild(splitBar);
				}
			}

			resizing = resize;
		});

		window.addEventListener('pointerdown', e => {
			if(resizing) {
				start = e;
			}
		});

		const cancel = e => {
			if(start) {
				window.dispatchEvent(new Event('layout'));
			}
			start = null;
		};

		window.addEventListener('pointerup', cancel);
		window.addEventListener('pointercancel', cancel);
	}

	set width(width) {
		this.style.width = width + "px";
	}
	get width() {
		return this.boundingBox.width;
	}

	set height(height) {
		this.style.height = height + "px";
	}
	get height() {
		return this.boundingBox.height;
	}

	update() {
		this.boundingBox = this.getBoundingClientRect();
		
		if(this.children.length === 0) {
			this.parentNode.removeChild(this);

			const children = [...this.parentNode.children].filter(ele => ele instanceof Column);
			const curr = children.indexOf(this);
			const neighbor = children[curr+1];

			neighbor.width += this.width;
		}
	}

}

customElements.define("gyro-layout-column", Column);
