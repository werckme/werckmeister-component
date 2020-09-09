import { IEditor, createNewEditor } from "./editor/IEditor";
import { AceEdCss } from "./AceEditorCss";


const template = document.createElement('template');

template.innerHTML = `
<style>
  #editor {
    position: relative; 
    border: 2px solid grey; 
    height:600px; 
    width:500px
  }
  ${AceEdCss}
</style>
<div id="editor">
</div>
`;
 
class Snippet extends HTMLElement {
  editor: IEditor;
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const newNode = template.content.cloneNode(true);
    this.shadowRoot.appendChild(newNode);
    setTimeout(this.init.bind(this), 1000);
    
  }

  init() {
    this.editor = createNewEditor();
    const el = this.shadowRoot.getElementById("editor");
    this.editor.attach(el);
    this.editor.setText(this.innerHTML);
  }
}

window.customElements.define('werckmeister-snippet', Snippet);