
import { Editor } from './editor/Editor';
import { WerckmeisterCompiler } from './compiler/Compiler';
declare const require;
const fs = require('fs');
const codemirrorCss = fs.readFileSync('./node_modules/codemirror/lib/codemirror.css', 'utf8')
require("babel-core/register");
require("babel-polyfill");

const template = document.createElement('template');
template.innerHTML = `
<style>
  #editor {
    border: 2px solid grey;
  }
  .wm-marked {
    border: 1px solid red;
  }
  ${codemirrorCss}
</style>
<div id="editor">
</div>
`;
 
const compiler = new WerckmeisterCompiler();

class Snippet extends HTMLElement {
  editor: Editor;
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const newNode = template.content.cloneNode(true);
    this.shadowRoot.appendChild(newNode);
    setTimeout(this.init.bind(this));
  }

  async init() {
    const el = this.shadowRoot.getElementById("editor");
    const script = this.innerHTML;
    this.editor = new Editor(el, script);
    const document = await compiler.compile({
      path: "noname.sheet",
      data: script
    });
    console.log(document);
  }
}

window.customElements.define('werckmeister-snippet', Snippet);