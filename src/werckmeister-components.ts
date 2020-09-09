import('../node_modules/werckmeister-ace-build/src-min-noconflict/ace');
import('../node_modules/werckmeister-ace-build/src-min-noconflict/mode-sheet.js');
import('../node_modules/werckmeister-ace-build/src-min-noconflict/theme-dracula.js');




const template = document.createElement('template');

template.innerHTML = `
  <textarea>
  </textarea>
`;
 
class Snippet extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    setTimeout(this.onLoad.bind(this), 5000);
    //console.log(ace);
  }

  get textarea(): HTMLElement  {
    return this.shadowRoot.querySelector('textarea')
  }

  addExternalScript(src: string) {
    const el = document.createElement("script"); 
    el.setAttribute("src", src); 
    document.body.appendChild(el); 
  }

  onLoad() {
    this.textarea.innerText = this.innerHTML;
  }
}

window.customElements.define('werckmeister-snippet', Snippet);