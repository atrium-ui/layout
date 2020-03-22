import Column from './Column.js';

export default class Group extends Column {

	static get observedAttributes() {
		return ['active-tab', 'show-tabs', 'fixed-tabs'];
	}

	static get template() {
		const groupTemplate = document.createElement("template");
		groupTemplate.innerHTML = `
			<style>
				.tabs {
					display: flex;
					background: var(--tabs-background);
					font-family: sans-serif;
					color: #b5b5b5;
					font-size: 12px;
					z-index: 1000;
					pointer-events: all;
					user-select: none;
					border-bottom: 1px solid var(--gyro-background);
				}
				
				.tab {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					background: var(--tab-background);
					margin: 0 1px 0 0;
					height: 30px;
					cursor: pointer;
					position: relative;
					min-width: 80px;
				}

				.tab[data-groupid] {
					-webkit-user-drag: element;
				}
				
				.tab[active] {
					color: var(--tab-font-color);
				}
				
				.tab::before {
					content: "";
					position: absolute;
					pointer-events: none;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
				}
				
				.tab:hover {
					color: var(--tab-font-color);
					background: var(--tab-hover-background);
				}

				.tab:active {
					background: var(--tab-background);
				}
				
				.tab[active] {
					background: var(--tab-active-background);
				}

				.add-tab {
					font-size: 14px;
					--icon-size: 10px;
				}

				slot {
					display: block;
					position: absolute;
					top: 30px;
					left: 0;
					bottom: 0;
					right: 0;
				}
			</style>
			<div class="tabs"></div>
		`;
		return groupTemplate.content;
	}

	get activeTab() {
		if(this.hasAttribute('active-tab')) {
			return +this.getAttribute("active-tab");
		} else {
			return null;
		}
	}

	set activeTab(index) {
		this.setActiveTab(index);
	}

	get tabs() {
		return this.shadowRoot.querySelectorAll(".tabs .tab[data-groupid]");
	}

	get components() {
		return [...this.children].filter(ele => ele.hasAttribute('tab'));
	}

	constructor() {
		super();

		this.shadowRoot.appendChild(this.constructor.template);
		this.shadowRoot.appendChild(this.shadowSlot);

		this.initializeDragAndDropHandlers();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if(oldValue === newValue) return;

		if(name === 'active-tab') {
			this.activeTab = newValue;
		}

		this.renderTabs();
	}

	connectedCallback() {
		// override default
	}

	slotChangeCallback(e) {
		if(this.components.length === 0) {
			this.parentNode.removeChild(this);
			return;
		}

		this.renderTabs();

		this.setActiveTab(this.components.length-1);
	}

	initializeDragAndDropHandlers() {

		let insertPosition = 0;

		const dragOverHandler = e => {
			if(!document.body.hasAttribute('layout-drag')) return;

			e.preventDefault();

			const bounds = this.getBoundingClientRect();

			const x = e.x;
			const y = e.y;

			const area = Math.min(bounds.height / 8, bounds.width / 8);
			
			this.removeAttribute('style');
			insertPosition = 0;

			if(y < bounds.top + area) {
				this.style.setProperty('--height', area + 'px');

				insertPosition = -1;
			} else if(y > bounds.bottom - area) {
				this.style.setProperty('--height', area + 'px');
				this.style.setProperty('--top', bounds.height - area + 'px');

				insertPosition = 1;
			} else if(x < bounds.left + area) {
				this.style.setProperty('--width', area + 'px');

				insertPosition = -2;
			} else if(x > bounds.right - area) {
				this.style.setProperty('--width', area + 'px');
				this.style.setProperty('--left', bounds.width - area + 'px');

				insertPosition = 2;
			}
			
			this.setAttribute('drag-over', '');

			e.dataTransfer.dropEffect = "move";
		}

		const dragEndHandler = e => {
			dragLeaveHandler(e);
			
			if(document.body.hasAttribute('layout-drag')) {
				document.body.removeAttribute('layout-drag');
			}
		}

		const dragLeaveHandler = e => {
			this.removeAttribute('drag-over');
			this.removeAttribute('style');
		}

		const dragDropHandler = e => {
			e.preventDefault();

			dragEndHandler();

			const targetId = e.dataTransfer.getData("tab");

			if(!targetId)
				return;

			const component = document.querySelector('['+targetId+']');

			if(!component)
				return;

			if(insertPosition === 0 && component.parentNode === this) 
				return;

			component.parentNode.removeChild(component);

			switch(insertPosition) {
				case -2:
					const newLeftColumn = this.parentNode.cloneNode();
					this.parentNode.width -= 500;
					newLeftColumn.width = 500;
					const newGroupLeft = this.cloneNode();
					newGroupLeft.appendChild(component);
					newLeftColumn.appendChild(newGroupLeft);
					this.parentNode.parentNode.insertBefore(newLeftColumn, this.parentNode);
					break;

				case -1:
					const newGroupAbove = this.cloneNode();
					newGroupAbove.appendChild(component);
					newGroupAbove.height = 400;
					this.height -= 400;
					this.parentNode.insertBefore(newGroupAbove, this);
					break;

				case 0:
					this.appendChild(component);
					break;

				case 1:
					const newGroupBelow = this.cloneNode();
					newGroupBelow.appendChild(component);
					newGroupBelow.height = 400;
					this.height -= 400;
					this.parentNode.insertBefore(newGroupBelow, this.nextSibling);
					break;
					
				case 2:
					const newRightColumn = this.parentNode.cloneNode();
					this.parentNode.width -= 500;
					newRightColumn.width = 500;
					const newGroupRight = this.cloneNode();
					newGroupRight.appendChild(component);
					newRightColumn.appendChild(newGroupRight);
					this.parentNode.parentNode.insertBefore(newRightColumn, this.parentNode.nextSibling);
					break;
			}
		}

		this.addEventListener('dragover', dragOverHandler);
		this.addEventListener('dragleave', dragLeaveHandler);
		this.addEventListener('dragend', dragEndHandler);
		this.addEventListener('drop', dragDropHandler);
	}

	// updates tabs bar if components have changed
	renderTabs() {
		const tabs = this.shadowRoot.querySelector(".tabs");
		tabs.innerHTML = "";

		// creates tab ele for component
		const createTab = component => {
			const tab = document.createElement("span");
			tab.className = "tab";

			if(component) {
				const groupid = component.getAttribute("tab");

				if(groupid) {
					tab.innerText = component.name || groupid;
					tab.dataset.groupid = groupid;
				}
	
				tab.onclick = e => {
					const index = [...tab.parentNode.children].indexOf(tab);
					this.activeTab = index;
				}
	
				tab.ondragstart = e => {
					document.body.setAttribute('layout-drag', '');
					e.dataTransfer.setData("tab", 'drag-target');
					component.setAttribute('drag-target', '');
				}
	
				tab.ondragend = e => {
					setTimeout(() => {
						component.removeAttribute('drag-target');
					}, 10);
				}

				tab.ondblclick = e => {
					const url = prompt('URL');
					const name = url.split("/")[url.split("/").length - 1];

					if(name) {
						tab.innerText = name;
						tab.dataset.groupid = name;
						component.setAttribute('tab', name);
						component.innerHTML = `<iframe src="${url}" frameborder="0" allowfullscreen="true" height="100%" width="100%"></iframe>`;
					}
				}

				tab.onmousedown = e => {
					// if(e.which === 2) {
					// 	component.remove();
					// }
				}
			}

			return tab;
		}

		const components = this.components;

		if (components.length > 1 || this.hasAttribute('show-tabs')) {
			for (let i = 0; i < components.length; i++) {
				const tab = createTab(components[i]);
				tabs.appendChild(tab);
			}
		}

		// append pseudo "+" tab
		if(!this.hasAttribute('fixed-tabs') && this.tabs.length > 0) {
			const addTab = createTab();
			addTab.innerHTML = '<gyro-icon icon="Add">+</gyro-icon>';
			addTab.classList.add('add-tab');
			addTab.addEventListener('click', () => {
				const cloned = components[components.length-1];
				const newTab = document.createElement(cloned.localName);
				newTab.setAttribute('tab', cloned.getAttribute('tab'));
				this.appendChild(newTab);
			});
			tabs.appendChild(addTab);
		}

		// set active tab if undefined
		if(this.activeTab == undefined) {
			this.activeTab = 0;
		}

		if(this.activeTab > this.tabs.length-1) {
			this.activeTab = Math.max(this.tabs.length-1, 0);
		}
	}

	// updates components and tab bar if active tab changed
	setActiveTab(index) {
		const tabs = this.tabs;
		const components = this.components;

		for (let i = 0; i < components.length; i++) {
			const tab = tabs[i];

			if(tab) {
				if (i == index) {
					tab.setAttribute("active", "");
				} else {
					tab.removeAttribute("active");
				}
			}

			if (components[i]) {
				if (i == index) {
					components[i].setAttribute("active", "");
				} else {
					components[i].removeAttribute("active");
				}
			}
		}
	}
}

customElements.define("gyro-group", Group);
