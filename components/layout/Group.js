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
					background: var(--gyro-darker-grey);
					font-family: sans-serif;
					color: #b5b5b5;
					font-size: 12px;
					z-index: 1000;
					pointer-events: all;
					user-select: none;
				}
				
				.tab {
					display: inline-flex;
					align-items: center;
					padding: 2px 14px;
					background: var(--gyro-grey);
					margin: 0 1px 0 0;
					height: 20px;
					cursor: pointer;
					position: relative;
				}

				.tab[data-groupid] {
					-webkit-user-drag: element;
				}
				
				.tab[active] {
					color: white;
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
				
				.tab:hover::before {
					color: white;
					background: rgba(255, 255, 255, 0.1);
				}
				
				.tab[active]::before,
				.tab:active::before {
					background: rgba(255, 255, 255, 0.05);
				}

				.add-tab {
					font-size: 14px;
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
		this.setAttribute("active-tab", index);
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

	slotChangeCallback() {
		if(this.components.length === 0) {
			this.parentNode.removeChild(this);
			return;
		}

		this.renderTabs();
	}

	initializeDragAndDropHandlers() {

		let insertPosition = 0;

		const dragOverHandler = e => {
			e.preventDefault();

			const bounds = this.getBoundingClientRect();

			const x = e.x;
			const y = e.y;

			const area = bounds.height / 5;

			if(y < bounds.top + area) {
				this.style.setProperty('--height', area + 'px');

				insertPosition = -1;
			} else if(y > bounds.bottom - area) {
				this.style.setProperty('--height', area + 'px');
				this.style.setProperty('--top', bounds.height - area + 'px');

				insertPosition = 1;
			} else {
				this.removeAttribute('style');

				insertPosition = 0;
			}
			
			this.setAttribute('drag-over', '');

			e.dataTransfer.dropEffect = "move";
		}

		const dragEndHandler = e => {
			this.removeAttribute('drag-over');
		}

		const dragDropHandler = e => {
			e.preventDefault();

			dragEndHandler();

			const targetId = e.dataTransfer.getData("tab");
			const component = document.querySelector('['+targetId+']');

			component.parentNode.removeChild(component);

			switch(insertPosition) {
				case -1:
					const newGroupAbove = this.cloneNode();
					newGroupAbove.appendChild(component);
					this.parentNode.insertBefore(newGroupAbove, this);
					break;
				case 0:
					this.appendChild(component);
					break;
				case 1:
					const newGroupBelow = this.cloneNode();
					newGroupBelow.appendChild(component);
					this.parentNode.insertBefore(newGroupBelow, this.nextSibling);
					break;
			}
		}

		this.addEventListener('dragover', dragOverHandler);
		this.addEventListener('dragleave', dragEndHandler);
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
					tab.innerText = groupid;
					tab.dataset.groupid = groupid;
				}
	
				tab.onclick = e => {
					const index = [...tab.parentNode.children].indexOf(tab);
					this.activeTab = index;
				}
	
				tab.ondragstart = e => {
					e.dataTransfer.setData("tab", 'drag-target');
					component.setAttribute('drag-target', '');
				}
	
				tab.ondragend = e => {
					component.removeAttribute('drag-target');
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
			addTab.innerText = '+';
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

		this.setActiveTab(this.activeTab);
	}

	// updates components and tab bar if active tab changed
	setActiveTab(index) {
		const tabs = this.tabs;
		const components = this.components;

		for (let i = 0; i < tabs.length; i++) {
			const tab = tabs[i];

			if (i == index) {
				tab.setAttribute("active", "");
			} else {
				tab.removeAttribute("active");
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
