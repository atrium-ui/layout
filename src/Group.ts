import { Column } from "./Column.js";

const styles = `
  :host {
		position: relative;
		overflow: hidden;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		color: inherit;

		--tab-height: 28px;
		--tab-width: auto;
		--tab-font-color: #ffffff;
		--tab-font-size: 0.8em;
		--tab-border-radius: 3px;
		--tab-padding: 0px 18px;
		--tab-border: none;

    --tab-background: #1C1C1C;
    --tab-hover-background: #2F2F32;
		--tab-active-background: #252527;

		--tab-bottom-border: none;
		--tab-active-bottom-border: none;
	}

	@media (prefers-color-scheme: light) {
    :host {
      --tab-background: #EEE;
      --tab-hover-background: #FFF;
 			--tab-active-background: #FFF;
    }
  }

	[part="tabs"] {
    display: flex;
    color: inherit;
    z-index: 1000;
    pointer-events: all;
    user-select: none;
    font-size: var(--tab-font-size);
    padding: 3px 3px 0 3px;
  }

	.tab {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--tab-background);
		margin: 0 1px 0 0;
		height: var(--tab-height);
		cursor: pointer;
		position: relative;
		min-width: var(--tab-width);
		padding: var(--tab-padding);
		border-bottom: var(--tab-bottom-border);
		color: var(--tab-font-color);
		opacity: 0.5;
		border-top-left-radius: var(--tab-border-radius);
		border-top-right-radius: var(--tab-border-radius);
		border: var(--tab-border);
	}

	.tab[data-groupid] {
		-webkit-user-drag: element;
	}

	.tab[active] {
		background: var(--tab-active-background);
		border-bottom: var(--tab-active-bottom-border);
		opacity: 1;
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
		background: var(--tab-hover-background);
	}

	.tab:active {
		background: var(--tab-active-background);
		opacity: 1;
	}

	slot {
		display: block;
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
	}

	:host([tabs]) slot {
		top: calc(var(--tab-height) + 3px);
	}

	:host([drag-over]) {
		--left: 0;
		--top: 0;
		--width: 100%;
		--height: 100%;
	}

	:host([drag-over])::slotted(*) {
		pointer-events: none;
	}

	:host([drag-over])::after {
		content: '';
		background: white;
		opacity: 0.05;
		position: absolute;
		top: var(--top);
		left: var(--left);
		z-index: 10000;
		width: var(--width);
		height: var(--height);
		pointer-events: none;
	}

	::slotted(*) {
   	width: 100%;
   	height: 100%;
   	position: absolute;
   	top: 0;
   	left: 0;
	}

	::slotted([tab]:not([active])) {
    display: none !important;
    visibility: hidden;
    opacity: 0;
    transition: none;
    pointer-events: none;
	}
`;

export class Group extends Column {
  static get observedAttributes() {
    return ["active-tab", "tabs"];
  }

  template() {
    return `
      <div part="tabs" class="tabs"></div>
      ${super.template()}
    `;
  }

  styles() {
    return `
      ${super.styles()}
      ${styles}
    `;
  }

  get activeTab() {
    if (this.hasAttribute("active-tab")) {
      return +(this.getAttribute("active-tab") || 0);
    }
    return -1;
  }

  set activeTab(index: number) {
    this.setActiveTab(index);
  }

  get tabs() {
    const elements = this.shadowRoot?.querySelectorAll(".tab[data-groupid]");
    return elements ? [...elements] : [];
  }

  get components() {
    return [...this.children].filter((ele) => ele.hasAttribute("tab"));
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    if (name === "active-tab") {
      this.activeTab = +newValue;
    }

    this.renderTabs();
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener("dragover", this.dragOverHandler);
    this.addEventListener("dragleave", this.dragLeaveHandler);
    this.addEventListener("dragend", this.dragEndHandler);
    this.addEventListener("drop", this.dragDropHandler);
  }

  slotChangeCallback() {
    super.slotChangeCallback();

    this.renderTabs();
    this.setActiveTab(this.components.length - 1);
  }

  insertPosition = 0;

  dragOverHandler = (e: DragEvent) => {
    if (!document.body.hasAttribute("layout-drag")) return;

    e.preventDefault();

    const bounds = this.getBoundingClientRect();

    const x = e.x;
    const y = e.y;

    const area = Math.min(bounds.height / 8, bounds.width / 8);

    this.removeAttribute("style");
    this.insertPosition = 0;

    if (y < bounds.top + area) {
      this.style.setProperty("--height", `${area}px`);

      this.insertPosition = -1;
    } else if (y > bounds.bottom - area) {
      this.style.setProperty("--height", `${area}px`);
      this.style.setProperty("--top", `${bounds.height - area}px`);

      this.insertPosition = 1;
    } else if (x < bounds.left + area) {
      this.style.setProperty("--width", `${area}px`);

      this.insertPosition = -2;
    } else if (x > bounds.right - area) {
      this.style.setProperty("--width", `${area}px`);
      this.style.setProperty("--left", `${bounds.width - area}px`);

      this.insertPosition = 2;
    }

    this.setAttribute("drag-over", "");

    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  };

  dragEndHandler = (e: DragEvent) => {
    this.dragLeaveHandler(e);

    if (document.body.hasAttribute("layout-drag")) {
      document.body.removeAttribute("layout-drag");
    }
  };

  dragLeaveHandler = (e: DragEvent) => {
    this.removeAttribute("drag-over");
    this.removeAttribute("style");
  };

  dragDropHandler = (e: DragEvent) => {
    e.preventDefault();

    this.dragEndHandler(e);

    const targetId = e.dataTransfer?.getData("tab");

    if (!targetId) return;

    const component = document.querySelector(`[${targetId}]`);

    if (!component) return;

    if (this.insertPosition === 0 && component.parentNode === this) return;

    component.parentNode?.removeChild(component);

    // apend inside
    if (this.insertPosition === 0) {
      this.appendChild(component);
    }

    // vertical
    if (Math.abs(this.insertPosition) === 1) {
      const oldHeight = this.height;
      const newGroup = this.cloneNode();

      newGroup.appendChild(component);

      // apend above
      if (this.insertPosition < 0) {
        newGroup.height = oldHeight / 2;
        this.height -= oldHeight / 2;
        this.parentNode?.insertBefore(newGroup, this);
      }

      // apend below
      if (this.insertPosition > 0) {
        newGroup.height = oldHeight / 2;
        this.height -= oldHeight / 2;
        this.parentNode?.insertBefore(newGroup, this.nextSibling);
      }
    }

    // horizontal
    if (Math.abs(this.insertPosition) === 2) {
      const oldWidth = this.parentNode.width;
      const newColumn = this.parentNode.cloneNode();
      const newGroup = this.cloneNode();

      newGroup.appendChild(component);
      newColumn.appendChild(newGroup);

      // apend to the left
      if (this.insertPosition < 0) {
        this.parentNode.width -= oldWidth / 2;
        newColumn.width = oldWidth / 2;
        this.parentNode.parentNode.insertBefore(newColumn, this.parentNode);
      }

      // apend to the right
      if (this.insertPosition > 0) {
        this.parentNode.width -= oldWidth / 2;
        newColumn.width = oldWidth / 2;
        this.parentNode.parentNode.insertBefore(newColumn, this.parentNode.nextSibling);
      }
    }
  };

  // updates tabs bar if components have changed
  renderTabs() {
    if (!this.shadowRoot) return;

    const tabs = this.shadowRoot.querySelector(".tabs");
    if (!tabs) return;

    tabs.innerHTML = "";

    // creates tab ele for component
    const createTab = (component) => {
      const tab = document.createElement("span");
      tab.setAttribute("draggable", "true");
      tab.className = "tab";
      tab.part = "tab";

      if (component) {
        const groupid = component.getAttribute("tab");

        if (groupid) {
          tab.innerText = component.name || groupid;
          tab.dataset.groupid = groupid;
        }

        tab.onmousedown = (e) => {
          const index = [...tab.parentNode.children].indexOf(tab);
          this.activeTab = index;
        };

        tab.ondragstart = (e) => {
          document.body.setAttribute("layout-drag", "");
          e.dataTransfer?.setData("tab", "drag-target");
          component.setAttribute("drag-target", "");
        };

        tab.ondragend = (e) => {
          setTimeout(() => {
            component.removeAttribute("drag-target");
          }, 10);
        };
      }

      return tab;
    };

    const components = this.components;

    if (components.length > 1 || this.hasAttribute("tabs")) {
      for (let i = 0; i < components.length; i++) {
        const tab = createTab(components[i]);
        tabs.appendChild(tab);
      }
    }

    // set active tab if undefined
    if (this.activeTab === undefined) {
      this.activeTab = 0;
    }

    if (this.activeTab > this.tabs?.length - 1) {
      this.activeTab = Math.max(this.tabs?.length - 1, 0);
    }
  }

  // updates components and tab bar if active tab changed
  setActiveTab(index: number) {
    const tabs = this.tabs;
    const components = this.components;

    for (let i = 0; i < components.length; i++) {
      const tab = tabs[i];

      if (tab) {
        if (i === index) {
          tab.setAttribute("active", "");
        } else {
          tab.removeAttribute("active");
        }
      }

      if (components[i]) {
        if (i === index) {
          components[i].setAttribute("active", "");
        } else {
          components[i].removeAttribute("active");
        }
      }
    }
  }
}
