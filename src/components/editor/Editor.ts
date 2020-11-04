import { ICompilerError, SheetEventInfo as ISheetEventInfo } from '../../compiler/Compiler';
import { Editor as EditorImpl, IMarker } from '../../editor/Editor';
const _ = require ('lodash');

declare const require;
const fs = require('fs');
const codemirrorCss = fs.readFileSync('./node_modules/codemirror/lib/codemirror.css', 'utf8');
const editorCss = fs.readFileSync('./src/components/editor/editor.css', 'utf8');
const editorHtml = fs.readFileSync('./src/components/editor/editor.html', 'utf8');

const template = document.createElement('template');
template.innerHTML = `
<style>
  ${codemirrorCss}
  ${editorCss}
</style>
${editorHtml}
`;
export class Editor extends HTMLElement {
	private _filename: string;
	public get filename(): string {
		return this._filename;
	}
	private eventMarkers: IMarker[] = [];
	private editor: EditorImpl;
	werckmeisterDocumentId: number;

	/**
	 * 
	 */
	private get editorElement(): HTMLElement {
		return this.shadowRoot.getElementById("editor")
	}

	/**
	 * 
	 */
	public clearAllMarkers() {
		this.editor.clearMarkers();
	}

	/**
	 * 
	 */
	constructor() {
		super();
		this.createElement();
	}

	private async createElement() {
		this.attachShadow({ mode: 'open' });
		const newNode = template.content.cloneNode(true);
		this.shadowRoot.appendChild(newNode);
		setTimeout(this.init.bind(this));
	}

	/**
	 * 
	 */
	initListener() {
	}


	/**
	 * 
	 */
	getScriptText(): string {
		const script = this.editor.getValue();
		return script.trim();
	}

	/**
	 * 
	 */
	setScriptText(text: string) {
		this.editor.setValue(text);
	}

	/**
	 * 
	 * @param error 
	 */
	setError(error: ICompilerError) {
		this.clearAllMarkers();
		this.editor.setErrorMarker(error.positionBegin, error.positionBegin + 1);
	}

	/**
	 * 
	 */
	private getScriptContent(text: string): string {
		const dataAttr = this.attributes.getNamedItem("wm-data");
		if(dataAttr) {
			return atob(dataAttr.value);
		}
		const cDataMatch = text.match(/\[CDATA\[(.*)\]\]/s);
		if (cDataMatch) {
			return cDataMatch[1];
		}
		return text;
	}

	/**
	 * 
	 */
	private init() {
		const el = this.shadowRoot.getElementById("editor");
		const script = this.getScriptContent(this.innerHTML);
		this.editor = new EditorImpl(el, script);
		this.initListener();
		this.readAttributes()
	}

	private async loadExternalCss(url: string) {
		const cssRequest = await fetch(url);
		const cssText = await cssRequest.text();
		const styleEl = document.createElement("style");
		styleEl.innerText = cssText;
		let x = this.shadowRoot.appendChild(styleEl);
	}

	private async readAttributes() {
		const styleAttr = this.attributes.getNamedItem("wm-style");
		if (styleAttr) {
			const editor = this.editorElement;
			editor.setAttribute("style", styleAttr.value);
		}
		const cssRefAttr = this.attributes.getNamedItem("wm-css-url");
		if (cssRefAttr) {
			this.loadExternalCss(cssRefAttr.value);
		}
		const fileName = this.attributes.getNamedItem("wm-filename");
		if (fileName) {
			this._filename = fileName.value;
		}		
	}

	public addMarkers(sheetEvents: ISheetEventInfo[]) {
		for(const sheetEvent of sheetEvents) {
			const marker = this.editor.setEventMarker(sheetEvent.beginPosition, sheetEvent.endPosition);
			this.eventMarkers.push(marker);
		}
	}
}