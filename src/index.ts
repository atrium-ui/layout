import { Column } from "./Column.js";
import { Group } from "./Group.js";
import { Panel } from "./Panel.js";

customElements.define("a-layout", Panel);
customElements.define("a-layout-column", Column);
customElements.define("a-layout-group", Group);

export { Column, Group, Panel };
