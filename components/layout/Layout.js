export default class Layout extends HTMLElement {

	constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		const slot = document.createElement('slot');
		this.shadowSlot = slot;
		this.shadowRoot.appendChild(slot);

		this.preventResizeEvent = false;
		
		window.addEventListener('resize', () => this.layoutUpdate());
		window.addEventListener('layout', () => this.layoutUpdate());
	}

	connectedCallback() {
		this.layoutUpdate();
		this.resizable();
	}

	get childElements() {
		return [...this.children].filter(ele => ele.boundingBox);
	}

	resizable() {
		const splitBar = document.createElement('div');
		splitBar.className = "split-bar";
		
		const borderSize = 4;

		let pointerDownEvent = null;
		let resizeAvailable = [0, 0];

		const pointerMoveHandler = (e, index) => {

			const columns = this.childElements;
			const column = columns[index];
			const neighbor = columns[index+1];
			const columnBounds = column.boundingBox;

			if(!neighbor) return;

			const mouse = [
				e.x,
				e.y
			];

			const delta = [
				column.width + e.movementX > 10 && neighbor.width - e.movementX > 10 ? e.movementX : 0,
				column.height + e.movementY > 10 && neighbor.height - e.movementY > 10 ? e.movementY : 0,
			];

			const resizable = [
				mouse[0] > columnBounds.right - borderSize && mouse[0] < columnBounds.right + borderSize,
				mouse[1] > columnBounds.bottom - borderSize && mouse[1] < columnBounds.bottom + borderSize,
			];

			const resizeX = resizable[0] || resizeAvailable[0];
			const resizeY = resizable[1] || resizeAvailable[1];

			if(pointerDownEvent) {

				if (resizeX) {
					column.width += delta[0];
					neighbor.width -= delta[0];
				}

				if (resizeY) {
					column.height += delta[1];
					neighbor.height -= delta[1];
				}

				this.layoutUpdate();
			}
	
			// update splitbar

			if(resizeX || resizeY && !splitBar.parentNode) {
				this.appendChild(splitBar);
			}

			if(splitBar.parentNode) {
				if(!pointerDownEvent && !resizeX && !resizeY) {
					splitBar.parentNode.removeChild(splitBar);
				}
				
				const layoutBounds = this.getBoundingClientRect();

				let borderX = columnBounds.x - (layoutBounds.x) + columnBounds.width;
				let borderY = columnBounds.y - (layoutBounds.y) + columnBounds.height;

				if(pointerDownEvent) {
					borderX += delta[0];
					borderY += delta[1];

					splitBar.setAttribute('active', '');
				} else {
					splitBar.removeAttribute('active');
				}

				if(resizeX) {
					splitBar.style.width = borderSize + "px";
					splitBar.style.height = columnBounds.height + "px";
					splitBar.style.setProperty('--x', borderX);
					splitBar.style.setProperty('--y', 0);
				}

				if(resizeY) {
					splitBar.style.height = borderSize + "px";
					splitBar.style.width = columnBounds.width + "px";
					splitBar.style.setProperty('--y', borderY);
					splitBar.style.setProperty('--x', columnBounds.width / 2 + 3);
				}
			}

			// set resize state
			if(!pointerDownEvent) {
				const prevented = !this.onResizeAvailableChange(resizable);
				if(!prevented) {
					resizeAvailable = resizable;
				}
			}

			return resizeAvailable[0] || resizeAvailable[1];
		};

		const cancelPointerHandler = e => {
			if(pointerDownEvent) {
				window.dispatchEvent(new Event('layout'));
			}
			pointerDownEvent = null;
		};

		const pointerDownHandler = e => {
			if(resizeAvailable[0] || resizeAvailable[1]) {
				pointerDownEvent = e;
				splitBar.setAttribute('active', '');
			}
		};

		let activeChild = null;

		window.addEventListener('pointermove', e => {
			if(resizeAvailable[0] || resizeAvailable[1]) {
				pointerMoveHandler(e, activeChild);
				e.preventDefault();
			} else {
				for(let c = 0; c < this.childElements.length; c++) {
					if(pointerMoveHandler(e, c)) {
						e.preventDefault();
						activeChild = c;
						return;
					}
				}
			}
		});

		window.addEventListener('pointerdown', pointerDownHandler);
		window.addEventListener('pointerup', cancelPointerHandler);
		window.addEventListener('pointercancel', cancelPointerHandler);
	}

	onResizeAvailableChange(resizeAvailable) {
		return true;
	}

	layoutUpdate() {
		if(this.preventResizeEvent) return;

		const availableWidth = this.clientWidth;
		const columns = this.childElements;
		const columnTemplate = [];

		for(let column of columns) {
			const fraction = (column.width / availableWidth) * columns.length;
			column.width = availableWidth * fraction;
			columnTemplate.push(fraction);
		}

		this.setLayoutTempalte(columnTemplate);

		this.preventResizeEvent = true;

		window.dispatchEvent(new Event('resize'));
		window.dispatchEvent(new Event('layout'));

		this.preventResizeEvent = false;
	}

	setLayoutTempalte(columnTemplate) {
		this.style.gridTemplateColumns = columnTemplate.map(n => n.toFixed(4) + "fr").join(" ");
	}

}

customElements.define("gyro-layout", Layout);
