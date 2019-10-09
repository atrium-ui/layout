export default class Layout extends HTMLElement {

	constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		const slot = document.createElement('slot');
		this.shadowSlot = slot;
		this.shadowRoot.appendChild(slot);

		this.resizableRow = false;
		this.resizableColumn = true;

		this.shadowSlot.addEventListener("slotchange", e => {
			this.slotChangeCallback();
		});
	}

	slotChangeCallback() {
		this.layoutUpdate();
	}

	connectedCallback() {
		this.resizable();
		this.disableOnDrag();

		window.addEventListener('resize', () => this.layoutUpdate());
	}

	get childElements() {
		return [...this.children].filter(ele => ele instanceof Layout);
	}

	disableOnDrag() {
		// ignore components on drag
		this.addEventListener('dragstart', () => {
			this.setAttribute('drag-over', '');
		});

		const dragEndHandler = () => {
			this.removeAttribute('drag-over', '');
		};

		this.addEventListener('dragend', dragEndHandler);
		this.addEventListener('drop', dragEndHandler);
	}

	resizable() {
		const splitBar = document.createElement('div');
		splitBar.className = "split-bar";
		
		const borderSize = 4;

		let pointerDownEvent = null;
		let resizeAvailable = [0, 0];

		const pointerMoveHandler = (e, index) => {

			const children = this.childElements;
			const column = children[index];
			const neighbor = children[index+1];
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
				this.resizableColumn && mouse[0] > columnBounds.right - borderSize && mouse[0] < columnBounds.right + borderSize && mouse[1] < columnBounds.bottom && mouse[1] > columnBounds.top,
				this.resizableRow && mouse[1] > columnBounds.bottom - borderSize && mouse[1] < columnBounds.bottom + borderSize && mouse[0] < columnBounds.right && mouse[0] > columnBounds.left,
			];

			const resizeX = resizable[0] || resizeAvailable[0];
			const resizeY = resizable[1] || resizeAvailable[1];

			if(pointerDownEvent) {
				if (resizeX) {
					this.onResize([delta[0], 0], column, neighbor);
				}
				if (resizeY) {
					this.onResize([0, delta[1]], column, neighbor);
				}
			}
	
			// update splitbar

			if(resizeX || resizeY && !splitBar.parentNode) {
				this.appendChild(splitBar);
			}

			if(splitBar.parentNode) {
				if(!pointerDownEvent && !resizeX && !resizeY) {
					splitBar.parentNode.removeChild(splitBar);
				}
				
				let borderX = columnBounds.x - this.boundingBox.x + columnBounds.width;
				let borderY = columnBounds.y - this.boundingBox.y + columnBounds.height;

				if(pointerDownEvent) {
					borderX += delta[0];
					borderY += delta[1];

					splitBar.setAttribute('active', '');
				} else {
					splitBar.removeAttribute('active');
				}

				if(resizeX) {
					splitBar.className = "split-bar vertical";
					splitBar.style.setProperty('--size', borderSize);
					splitBar.style.setProperty('--x', borderX);
					splitBar.style.setProperty('--y', 0);
				}

				if(resizeY) {
					splitBar.className = "split-bar horizontal";
					splitBar.style.setProperty('--size', borderSize);
					splitBar.style.setProperty('--y', borderY);
					splitBar.style.setProperty('--x', 0);
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
			pointerDownEvent = null;
			splitBar.removeAttribute('active');
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

	onResize(delta, column, neighbor) {

		column.width += delta[0];
		neighbor.width -= delta[0];

		column.height += delta[1];
		neighbor.height -= delta[1];
		
		this.layoutUpdate();
	}

	layoutUpdate() {
		const availableWidth = this.clientWidth;
		const availableHeight = this.clientHeight;

		const children = this.childElements;

		const columnTemplate = [];
		const rowTemplate = [];

		for(let child of children) {

			// column
			if(this.resizableColumn) {
				let columnFraction = 1;

				if(children.length == 1) {
					child.width = availableWidth;
				} else {
					columnFraction = (child.width / availableWidth) * children.length;
					child.width = availableWidth * columnFraction;
				}

				columnTemplate.push(columnFraction);
			}

			// row
			if(this.resizableRow) {
				let rowFraction = 1;

				if(children.length == 1) {
					child.height = availableHeight;
				} else {
					rowFraction = (child.height / availableHeight) * children.length;
					child.height = availableHeight * rowFraction;
				}

				rowTemplate.push(rowFraction);
			}
		}

		this.setLayoutTempalte(columnTemplate, rowTemplate);

		for(let child of children) {
			child.layoutUpdate();
		}
		
		this.updateBounds();

		window.dispatchEvent(new Event('layout'));
	}

	updateBounds() {
		this.width = this.clientWidth;
		this.height = this.clientHeight;
		this.boundingBox = this.getBoundingClientRect();
	}

	setLayoutTempalte(columnTemplate, rowTemplate) {
		if(this.resizableColumn) {
			this.style.gridTemplateColumns = columnTemplate.map(n => n.toFixed(4) + "fr").join(" ");
		}
		if(this.resizableRow) {
			this.style.gridTemplateRows = rowTemplate.map(n => n.toFixed(4) + "fr").join(" ");
		}
	}

}

customElements.define("gyro-layout", Layout);
