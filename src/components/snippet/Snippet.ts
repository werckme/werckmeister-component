import { Editor } from '../../editor/Editor';
import { WM_Compiler, WM_Player } from '../../Global';

declare const require;
const fs = require('fs');
const codemirrorCss = fs.readFileSync('./node_modules/codemirror/lib/codemirror.css', 'utf8');
const snippetCss = fs.readFileSync('./src/components/snippet/snippet.css', 'utf8');
const snippetHtml = fs.readFileSync('./src/components/snippet/snippet.html', 'utf8');

const template = document.createElement('template');
template.innerHTML = `
<style>
  ${snippetCss}
  ${codemirrorCss}
</style>
${snippetHtml}
`;
export class Snippet extends HTMLElement {
	editor: Editor;
	/**
	 * 
	 */
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		const newNode = template.content.cloneNode(true);
		this.shadowRoot.appendChild(newNode);
		setTimeout(this.init.bind(this));
	}

	/**
	 * 
	 */
	initListener() {
		const playCta = this.shadowRoot.getElementById("btnPlay");
		playCta.addEventListener("click", this.onPlayClicked.bind(this));
	}


	/**
	 * 
	 */
	async onPlayClicked(ev: MouseEvent) {
		const script = this.editor.getValue();
		const document = await WM_Compiler.compile({
			path: "noname.sheet",
			data: script
		});
		WM_Player.tempo = document.midi.bpm;
		WM_Player.play(document.midi.midiData, ev);
	}

	/**
	 * 
	 */
	init() {
		const el = this.shadowRoot.getElementById("editor");
		const script = this.innerHTML;
		this.editor = new Editor(el, script);
		this.initListener();
	}
}