
import { Editor } from './editor/Editor';
declare const require;
const fs = require('fs');
const codemirrorCss = fs.readFileSync('./node_modules/codemirror/lib/codemirror.css', 'utf8')

const template = document.createElement('template');
template.innerHTML = `
<style>
  #editor {
    border: 2px solid grey;
  }
  ${codemirrorCss}
</style>
<div id="editor">
</div>
`;
 
class Snippet extends HTMLElement {
  editor: Editor;
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const newNode = template.content.cloneNode(true);
    this.shadowRoot.appendChild(newNode);
    setTimeout(this.init.bind(this));
  }

  init() {
    const el = this.shadowRoot.getElementById("editor");
    this.editor = new Editor(el, this.innerHTML);
  }
}

window.customElements.define('werckmeister-snippet', Snippet);