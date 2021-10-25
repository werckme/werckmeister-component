import { Editor, IMarker } from '../../editor/Editor';
import { resetCompiler, WM_Compiler, WM_Player } from '../../Global';
import { IMidiplayerEvent, Player } from '../../player/Player';
import { EventType } from '../../shared/midiEvent';
import { IWerckmeisterCompiledDocument, ICompilerError, IRequestFile } from '../../compiler/Compiler';
import { PlayerState } from '../../shared/player';
import { singleSnippetTemplate, snippetTemplate } from './templates';
import { fetchText } from '../../shared/http';
import { kebabCase } from 'lodash';
const _ = require ('lodash');

const CodemirrorTheme = "dracula";
const MainSheetFile = 'main.sheet';
declare const require;
const fs = require('fs');
var codemirrorCss = fs.readFileSync('./node_modules/codemirror/lib/codemirror.css', 'utf8');
codemirrorCss += fs.readFileSync('./node_modules/codemirror/theme/' + CodemirrorTheme + '.css', 'utf8');
const snippetCss = fs.readFileSync('./src/components/snippet/snippet.css', 'utf8');
const snippetHtml = fs.readFileSync('./src/components/snippet/snippet.html', 'utf8');

enum SnippetType {
	/**
	 * not a complete script, just on single voice
	 */
	single,
	default
}

let NumSnippets = 0;
const PlayingSnippets = new Map<number, Snippet>();

const template = document.createElement('template');
template.innerHTML = `
<style>
  ${codemirrorCss}
  ${snippetCss}
</style>
${snippetHtml}
`;
export class Snippet extends HTMLElement {
	snippetId = NumSnippets++;
	editor: Editor;
	document: IWerckmeisterCompiledDocument;
	snippetDocumentId: number;
	bpm: number = 120;
	private type: SnippetType = SnippetType.default;
	private eventMarkers: IMarker[] = [];
	private playingStateName = "wm-state-playing";
	private stoppedStateName = "wm-state-stopped";
	private snippetName = "noname.sheet";
	private scriptToSnippetCharOffset = 0;
	private _playerIsFetching: boolean;
	private _defLines: string;
	private _addSources: string;
	public onPlayerStateChanged: (oldState: PlayerState, newSate: PlayerState) => void;

	set playerIsFetching(val: boolean) {
		this._playerIsFetching = val;
		const snippetEl = this.snippetElement;
		if (val) {
			snippetEl.classList.add("wm-player-fetching");
		} else {
			snippetEl.classList.remove("wm-player-fetching");
		}
	}
	
	get playerIsFetching(): boolean {
		return this._playerIsFetching;
	}

	get snippetElement(): HTMLElement {
		return this.shadowRoot.getElementById("wm-snippet")
	}

	get messagesElement(): HTMLElement {
		return this.shadowRoot.getElementById("messages")
	}

	get playButtonElement(): HTMLElement {
		return this.shadowRoot.getElementById("btnPlay");
	}

	get stopButtonElement(): HTMLElement {
		return this.shadowRoot.getElementById("btnStop");
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
	private initListener() {
		const playCta = this.playButtonElement;
		playCta.addEventListener("click", this.onPlayClicked.bind(this));
		const stopCta = this.stopButtonElement;
		stopCta.addEventListener("click", this.onStopClicked.bind(this));
	}

	/**
	 * 
	 * @param ev 
	 */
	private onMidiEvent(ev: IMidiplayerEvent) {
		if (ev.midiEvent.eventType === EventType.NoteOn) {
			this.updateMarkers(ev.position);
		}
	}

	async stopAllSippets() {
		const snippets = Array.from(PlayingSnippets.values());
		for(const snippet of snippets) {
			await snippet.stop();
		}
		return new Promise<void>(resolve => {
			setTimeout(resolve, 100);
		});
	}

	/**
	 * 
	 */
	private onPlayerState(old: PlayerState, new_: PlayerState) {
		if (new_ === PlayerState.Playing) {
			PlayingSnippets.set(this.snippetId, this);
			this.setControlsStatePlaying();
		}
		if (new_ === PlayerState.Stopped) {
			PlayingSnippets.delete(this.snippetId);
			this.clearEventMarkers();
			this.setControlsStateStopped();
		}
		if (this.onPlayerStateChanged) {
			this.onPlayerStateChanged(old, new_);
		}
	}

	/**
	 * 
	 */
	private setControlsStateStopped() {
		const snippet = this.snippetElement;
		snippet.classList.remove(this.playingStateName);
		snippet.classList.add(this.stoppedStateName);
	}

	/**
	 * 
	 */
	private setControlsStatePlaying() {
		const snippet = this.snippetElement;
		snippet.classList.remove(this.stoppedStateName);
		snippet.classList.add(this.playingStateName);
	}

	/**
	 * 
	 */
	private clearEventMarkers() {
		for(const mark of this.eventMarkers) {
			mark.clear();
		}
	}

	/**
	 * 
	 * @param time 
	 */
	private updateMarkers(time: number) {
		this.clearEventMarkers();
		const treffer = _(this.document.eventInfos)
			.map(x => ({diff: Math.abs(time - x.sheetTime), sheetEvents: x.sheetEventInfos}))
			.minBy(x => x.diff);
		if (!treffer) {
			return;
		}
		const charOffset = this.scriptToSnippetCharOffset;
		for(const sheetEvent of treffer.sheetEvents) {
			if (sheetEvent.sourceId !== this.snippetDocumentId) {
				continue;
			}
			const marker = this.editor.setEventMarker(sheetEvent.beginPosition-charOffset, sheetEvent.beginPosition-charOffset + 1);
			this.eventMarkers.push(marker);
		}
	}

	public getPlayerImpl(): Player {
		return WM_Player;
	}

	/**
	 * 
	 */
	getScriptText(): string {
		const script = this.editor.getValue();
		if (!script.trim()) {
			return "";
		}
		this.scriptToSnippetCharOffset = 0;
		let defLines:string = undefined;
		if (this._defLines) {
			defLines = atob(this._defLines);
		}		
		if (this.type === SnippetType.single) {
			const rendered = singleSnippetTemplate(script, this.bpm, defLines); 
			this.scriptToSnippetCharOffset = rendered.charOffset;
			return rendered.script.trim();
		}
		if (defLines) {
			const rendered = snippetTemplate(script, this.bpm, defLines); 
			this.scriptToSnippetCharOffset = rendered.charOffset;
			return rendered.script.trim(); 
		}
		return script.trim();
	}

	/**
	 * 
	 * @param ev 
	 */
	async onPlayClicked(ev: MouseEvent) {
		try {
			await this.stopAllSippets();
			await this.startPlayer(ev);
		} catch(ex) {
			if (ex.error) {
				this.onError(ex.error);
			} else {
				console.log(ex);
			}
			return;
		}
	}

	private async getWorkspaceFormUrl(url: string) {
		const request = await fetch(url);
		const workspaceJson = await request.json();
		let files = workspaceJson.files as IRequestFile[];
		return files;
	}

	private getAdditionalSources(): IRequestFile[] {
		if (!this._addSources) {
			return [];
		}
		const strJson = atob(this._addSources);
		const json = JSON.parse(strJson);
		if (!Array.isArray(json)) {
			return [];
		}
		return json as IRequestFile[];
	}
	

	/**
	 * 
	 * @param ev 
	 */
	public async startPlayer(ev: MouseEvent) {
		await resetCompiler();
		this.editor.clearEventMarkers();
		this.clearMessages();
		const script = this.getScriptText();
		if (!script) {
			return;
		}
		this.snippetDocumentId = null;
		this.playerIsFetching = true;
		try {
			const files:IRequestFile[] = [{
				path: this.snippetName,
				data: script
			}, ...this.getAdditionalSources()];
			this.document = await WM_Compiler.compile(files);
		} catch(ex) {
			if (ex.error) {
				this.onError(ex.error);
			} else {
				console.log(ex)
			}
			this.playerIsFetching = false;
			return;
		}
		this.snippetDocumentId = _(this.document.midi.sources)
			.find(source => source.path === `/${this.snippetName}`).sourceId;

		if (!this.snippetDocumentId) {
			console.error("werckmeister compiler could not assign main document")
		}
		WM_Player.tempo = this.document.midi.bpm;
		try {
			await WM_Player.play(this.document.midi.midiData, ev, this.onMidiEvent.bind(this), this.onPlayerState.bind(this));
		} finally {
			this.playerIsFetching = false;
		}
	}

	/**
	 * 
	 * @param ev 
	 */
	private async onStopClicked(_ev: MouseEvent) {
		this.stop();
	}

	/**
	 * 
	 * @param ev 
	 */
	public async stop() {
		await WM_Player.stop();
	}


	// workaround: error messages pushes editor down and the following content will be overlapped
	private editorOverlappingWorkaround(size: number) {
		if (!size) {
			this.snippetElement.style.marginBottom = "";
			return;
		}
		this.snippetElement.style.marginBottom = `${size}px`;
	}

	/**
	 * 
	 * @param message 
	 * @param type 
	 */
	private setMessage(message: string, type:string = "info") {
		const el = this.messagesElement;
		el.innerHTML = `<span class="${type}">${message}</span>`
		this.editorOverlappingWorkaround(el.clientHeight*2);
	}

	/**
	 * 
	 */
	private clearMessages() {
		const el = this.messagesElement;
		el.innerHTML = "";
		this.editorOverlappingWorkaround(0);
	}

	/**
	 * 
	 * @param error 
	 */
	private onError(error: ICompilerError) {
		const charOffset = this.scriptToSnippetCharOffset
		this.editor.setErrorMarker(error.positionBegin - charOffset, error.positionBegin - charOffset + 1);
		console.error(`werckmeister compiler error: ${error.errorMessage}`);
		this.setMessage(`${error.errorMessage}`, "error");
	}

	/**
	 * 
	 * @param text 
	 */
	private async getScriptContent(text: string): Promise<string> {
		const workspaceUrl = this.attributes.getNamedItem("wm-workspace-url");
		if (workspaceUrl) {
			const workspace = await this.getWorkspaceFormUrl(workspaceUrl.value);
			const main = workspace.find(x => x.path === MainSheetFile);
			const additionalSources = workspace.filter(file => file.path !== MainSheetFile)
			this._addSources = btoa(JSON.stringify(additionalSources));
			return main.data;
		}	
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
	async init() {
		const el = this.shadowRoot.getElementById("editor");
		const script = await this.getScriptContent(this.innerHTML);
		this.editor = new Editor(el, script, { theme: CodemirrorTheme });
		this.setControlsStateStopped();
		this.initListener();
		this.readAttributes()
	}

	/**
	 * 
	 * @param url 
	 */
	private async loadExternalCss(url: string) {
		const cssText = await fetchText(url);
		const styleEl = document.createElement("style");
		styleEl.innerText = cssText;
		this.shadowRoot.appendChild(styleEl);
	}

	/**
	 * 
	 */
	private async readAttributes() {
		const typeAttr = this.attributes.getNamedItem("wm-type");
		if (typeAttr && typeAttr.value === "single") {
			this.type = SnippetType.single;
		}
		const tempoAttr = this.attributes.getNamedItem("wm-tempo");
		if (tempoAttr) {
			this.bpm = Number.parseFloat(tempoAttr.value);
		}
		const styleAttr = this.attributes.getNamedItem("wm-style");
		if (styleAttr) {
			const snippet = this.snippetElement;
			snippet.setAttribute("style", styleAttr.value);
		}
		const cssRefAttr = this.attributes.getNamedItem("wm-css-url");
		if (cssRefAttr) {
			this.loadExternalCss(cssRefAttr.value);
		}
		const defLines = this.attributes.getNamedItem("wm-def");
		if (defLines) {
			this._defLines = defLines.value;
		}
		const additionalSources = this.attributes.getNamedItem("wm-add-sources");
		if (additionalSources) {
			this._addSources = additionalSources.value;
		}
		const soundfontRepoUrl = this.attributes.getNamedItem("wm-soundfont-url");
		if (soundfontRepoUrl) {
			WM_Player.setSoundfontRepoUrl(soundfontRepoUrl.value);
		}				
	}
}