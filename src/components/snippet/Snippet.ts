import { Editor, IMarker } from '../../editor/Editor';
import { WM_Compiler, WM_Player } from '../../Global';
import { IMidiplayerEvent } from '../../player/Player';
import { EventType } from '../../shared/midiEvent';
import { IWerckmeisterCompiledDocument, ICompilerError } from '../../compiler/Compiler';
const _ = require ('lodash');

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
	document: IWerckmeisterCompiledDocument;
	eventMarkers: IMarker[] = [];
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
	onEof() {
		this.clearEventMarkers();
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
		for(const sheetEvent of treffer.sheetEvents) {
			const marker = this.editor.setEventMarker(sheetEvent.beginPosition, sheetEvent.endPosition);
			this.eventMarkers.push(marker);
		}
	}

	/**
	 * 
	 */
	async onPlayClicked(ev: MouseEvent) {
		this.editor.clearMarkers();
		const script = this.editor.getValue();
		try {
			this.document = await WM_Compiler.compile({
				path: "noname.sheet",
				data: script
			});
		} catch(ex) {
			this.onError(ex.error);
			return;
		}
		WM_Player.tempo = this.document.midi.bpm;
		WM_Player.play(this.document.midi.midiData, ev, this.onMidiEvent.bind(this), this.onEof.bind(this));
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
	init() {
		const el = this.shadowRoot.getElementById("editor");
		const script = this.innerHTML;
		this.editor = new Editor(el, script);
		this.initListener();
	}
}