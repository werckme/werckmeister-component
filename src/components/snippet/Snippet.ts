import { Editor, IMarker } from '../../editor/Editor';
import { WM_Compiler, WM_Player } from '../../Global';
import { IMidiplayerEvent } from '../../player/Player';
import { EventType } from '../../shared/midiEvent';
import { IWerckmeisterCompiledDocument, ICompilerError } from '../../compiler/Compiler';
import { PlayerState } from '../../shared/player';
import { singleSnippetTemplate } from './templates';
const _ = require ('lodash');

declare const require;
const fs = require('fs');
const codemirrorCss = fs.readFileSync('./node_modules/codemirror/lib/codemirror.css', 'utf8');
const snippetCss = fs.readFileSync('./src/components/snippet/snippet.css', 'utf8');
const snippetHtml = fs.readFileSync('./src/components/snippet/snippet.html', 'utf8');

enum SnippetType {
	/**
	 * not a complete script, just on single voice
	 */
	single,
	default
}

const template = document.createElement('template');
template.innerHTML = `
<style>
  ${codemirrorCss}
  ${snippetCss}
</style>
${snippetHtml}
`;
export class Snippet extends HTMLElement {

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

	set playerIsFetching(val: boolean) {
		this._playerIsFetching = val;
		const snippetEl = this.snippetElement;
		if (val) {
			snippetEl.classList.add("wm-player-fetching");
		} else {
			snippetEl.classList.remove("wm-player-fetching");
		}
	}

	get snippetElement(): HTMLElement {
		return this.shadowRoot.getElementById("wm-snippet")
	}

	get playButtonElement(): HTMLElement {
		return this.shadowRoot.getElementById("btnPlay");
	}

	get stopButtonElement(): HTMLElement {
		return this.shadowRoot.getElementById("btnStop");
	}

	get playerIsFetching(): boolean {
		return this._playerIsFetching;
	}

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
		const playCta = this.playButtonElement;
		playCta.addEventListener("click", this.onPlayClicked.bind(this));
		const stopCta = this.stopButtonElement;
		stopCta.addEventListener("click", this.onStopClicked.bind(this));
	}

	/**
	 * 
	 * @param ev 
	 */
	onMidiEvent(ev: IMidiplayerEvent) {
		if (ev.midiEvent.eventType === EventType.NoteOn) {
			this.updateMarkers(ev.position);
		}
	}

	/**
	 * 
	 */
	onPlayerState(old: PlayerState, new_: PlayerState) {
		if (new_ === PlayerState.Stopped) {
			this.clearEventMarkers();
			this.setControlsStateStopped();
		}
		if (new_ === PlayerState.Playing) {
			this.setControlsStatePlaying();
		}
	}

	/**
	 * 
	 */
	setControlsStateStopped() {
		const snippet = this.snippetElement;
		snippet.classList.remove(this.playingStateName);
		snippet.classList.add(this.stoppedStateName);
	}

	/**
	 * 
	 */
	setControlsStatePlaying() {
		const snippet = this.snippetElement;
		snippet.classList.remove(this.stoppedStateName);
		snippet.classList.add(this.playingStateName);
	}

	/**
	 * 
	 */
	clearEventMarkers() {
		for(const mark of this.eventMarkers) {
			mark.clear();
		}
	}

	/**
	 * 
	 * @param time 
	 */
	updateMarkers(time: number) {
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
			const marker = this.editor.setEventMarker(sheetEvent.beginPosition-charOffset, sheetEvent.endPosition-charOffset);
			this.eventMarkers.push(marker);
		}
	}

	/**
	 * 
	 */
	getScriptText(): string {
		const script = this.editor.getValue();
		this.scriptToSnippetCharOffset = 0;
		if (this.type === SnippetType.single) {
			const rendered = singleSnippetTemplate(script, this.bpm); 
			this.scriptToSnippetCharOffset = rendered.charOffset;
			return rendered.script;
		}
		return script;
	}

	/**
	 * 
	 */
	async onPlayClicked(ev: MouseEvent) {
		this.editor.clearMarkers();
		const script = this.getScriptText();
		this.snippetDocumentId = null;
		this.playerIsFetching = true;
		try {
			this.document = await WM_Compiler.compile({
				path: this.snippetName,
				data: script
			});
		} catch(ex) {
			this.onError(ex.error);
			this.playerIsFetching = true;
			return;
		}
		this.snippetDocumentId = _(this.document.midi.sources)
			.find(source => source.path === `/${this.snippetName}`).sourceId;

		if (!this.snippetDocumentId) {
			console.error("werckmeister compiler could not assign main document")
		}
			
		WM_Player.tempo = this.document.midi.bpm;
		await WM_Player.play(this.document.midi.midiData, ev, this.onMidiEvent.bind(this), this.onPlayerState.bind(this));
		this.playerIsFetching = false;
	}

	/**
	 * 
	 */
	async onStopClicked(ev: MouseEvent) {
		WM_Player.stop();
	}


	/**
	 * 
	 * @param error 
	 */
	onError(error: ICompilerError) {
		this.editor.setErrorMarker(error.positionBegin, error.positionBegin + 1);
		console.error(`werckmeister compiler error: ${error.errorMessage}`);
	}

	/**
	 * 
	 */
	getScriptContent(text: string): string {
		const cDataMatch = text.match(/\[CDATA\[(.*)\]\]/s);
		console.log(cDataMatch)
		if (cDataMatch) {
			return cDataMatch[1];
		}
		return text;
	}

	/**
	 * 
	 */
	init() {
		const el = this.shadowRoot.getElementById("editor");
		const script = this.getScriptContent(this.innerHTML);
		this.editor = new Editor(el, script);
		this.readAttributes();
		this.setControlsStateStopped();
		this.initListener();
	}

	readAttributes() {
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
	}
}