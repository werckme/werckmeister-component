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
        this.addExternalScripts();
    }
    get textarea() {
        return this.shadowRoot.querySelector('textarea');
    }
    addExternalScript(src) {
        const el = document.createElement("script");
        el.setAttribute("src", src);
        document.body.appendChild(el);
    }
    addExternalScripts() {
        this.addExternalScript("https://werckme.github.io/assets/mudcube/inc/jasmid/stream.js");
        this.addExternalScript("https://raw.githubusercontent.com/ajaxorg/ace-builds/master/src-min/ace.js");
        this.addExternalScript("https://raw.githubusercontent.com/ajaxorg/ace-builds/master/src-min/mode-sheet.js");
        this.addExternalScript("https://raw.githubusercontent.com/ajaxorg/ace-builds/master/src-min/theme-dracula.js");
    }
    onLoad() {
        this.textarea.innerText = this.innerHTML;
        console.log(ace);
    }
}
window.customElements.define('werckmeister-snippet', Snippet);
//# sourceMappingURL=werckmeister-components.js.map