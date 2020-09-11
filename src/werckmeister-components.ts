
import { Editor } from './editor/Editor';
import { WerckmeisterCompiler } from './compiler/Compiler';
declare const require;
const fs = require('fs');
const codemirrorCss = fs.readFileSync('./node_modules/codemirror/lib/codemirror.css', 'utf8')
const snippetCss = fs.readFileSync('./src/snippet.css', 'utf8')
require("babel-core/register");
require("babel-polyfill");

const template = document.createElement('template');
template.innerHTML = `
<style>
  ${snippetCss}
  ${codemirrorCss}
</style>
<a id="btnPlay">Play</a>
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

  initListener() {
    const playCta = this.shadowRoot.getElementById("btnPlay");
    playCta.addEventListener("click", this.onPlayClicked.bind(this));
  }


  onPlayClicked() {
    console.log("play");
  }

  async init() {
    const el = this.shadowRoot.getElementById("editor");
    const script = this.innerHTML;
    this.editor = new Editor(el, script);
    this.initListener();
    const document = await compiler.compile({
      path: "noname.sheet",
      data: script
    });
    console.log(document);
  }
}

window.customElements.define('werckmeister-snippet', Snippet);