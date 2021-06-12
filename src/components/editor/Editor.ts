import { ICompilerError, ICompilerWarning, SheetEventInfo as ISheetEventInfo } from '../../compiler/Compiler';
import { Editor as EditorImpl, IMarker, Mode } from '../../editor/Editor';
import { fetchText } from '../../shared/http';
const _ = require ('lodash');

declare const require;
const fs = require('fs');
let codemirrorCss = fs.readFileSync('./node_modules/codemirror/lib/codemirror.css', 'utf8');
const editorCss = fs.readFileSync('./src/components/editor/editor.css', 'utf8');
const editorHtml = fs.readFileSync('./src/components/editor/editor.html', 'utf8');
const CodemirrorTheme = "dracula";
codemirrorCss += fs.readFileSync('./node_modules/codemirror/theme/' + CodemirrorTheme + '.css', 'utf8');

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
	private editorImpl: EditorImpl;
	werckmeisterDocumentId: number;

	public setFilename(newName: string) {
		this._filename = newName;
		this.updateMode();
	}

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
		this.editorImpl.clearAllMarkers();
	}

	/**
	 * 
	 */
	public clearMarkersExceptWarnings() {
		this.editorImpl.clearMarkersExceptWarnings();
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

	private updateMode() {
		if (!this.filename) {
			this.editorImpl.setMode(Mode.text);
			return;
		}
		const match = this.filename.match(/.*(\.[^.]*$)/)
		if (!match || match.length < 2) {
			this.editorImpl.setMode(Mode.text);
			return;
		}
		const ext = match[1];
		switch(ext) {
			case '.sheet'   : 	
			case '.template': return this.editorImpl.setMode(Mode.sheet);
			case '.lua'     : return this.editorImpl.setMode(Mode.lua);
			default         : return this.editorImpl.setMode(Mode.text);
		}
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
		const script = this.editorImpl.getValue();
		return script.trim();
	}

	/**
	 * 
	 */
	setScriptText(text: string) {
		this.editorImpl.setValue(text);
	}

	/**
	 * 
	 * @param error 
	 */
	setError(error: ICompilerError) {
		this.clearAllMarkers();
		this.editorImpl.setErrorMarker(error.positionBegin, error.positionBegin + 1);
	}

	addWarning(warning: ICompilerWarning) {
		this.editorImpl.setWarningMarker(warning.message, warning.positionBegin, warning.positionBegin + 1);
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
		this.editorImpl = new EditorImpl(el, script, { theme: CodemirrorTheme, lineNumbers: true });
		this.initListener();
		this.readAttributes()
	}

	private async loadExternalCss(url: string) {
		const cssText = await fetchText(url);
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
			this.setFilename(fileName.value);
		}		
	}

	public addMarkers(sheetEvents: ISheetEventInfo[]) {
		for(const sheetEvent of sheetEvents) {
			const marker = this.editorImpl.setEventMarker(sheetEvent.beginPosition, sheetEvent.beginPosition + 1);
			this.eventMarkers.push(marker);
		}
	}

	public update() {
		this.editorImpl.update();
	}

	isClean() {
        return this.editorImpl.isClean();
    }

    markClean() {
        this.editorImpl.markClean();
	}
	
	clearHistory() {
		this.editorImpl.clearHistory();
	}
}