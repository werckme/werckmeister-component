import { WM_Compiler, WM_Player } from '../../Global';
import { IMidiplayerEvent } from '../../player/Player';
import { EventType } from '../../shared/midiEvent';
import { IWerckmeisterCompiledDocument, ICompilerError, SheetEventInfo } from '../../compiler/Compiler';
import { PlayerState } from '../../shared/player';
import { Editor } from '../editor/Editor';
const _ = require ('lodash');

declare const require;
const fs = require('fs');
const editorCss = fs.readFileSync('./src/components/workspace/workspace.css', 'utf8');
const editorHtml = fs.readFileSync('./src/components/workspace/workspace.html', 'utf8');


const template = document.createElement('template');
template.innerHTML = `
<style>
${editorCss}
</style>
${editorHtml}
`;
export class Workspace extends HTMLElement {
	document: IWerckmeisterCompiledDocument;
    bpm: number = 120;
    private _playerIsFetching: boolean;
    private editors: Editor[] = [];
    private sourceIdEditorMap: Map<number, Editor> = new Map<number, Editor>();
	private set playerIsFetching(val: boolean) {
		this._playerIsFetching = val;
	}


	private get playButtonElement(): HTMLElement {
		return this.shadowRoot.getElementById("btnPlay");
	}

	private get stopButtonElement(): HTMLElement {
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
	 * @param time 
	 */
	updateMarkers(time: number) {
		this.clearAllEditorMarkers();
		const treffer:{diff:number, sheetEvents:SheetEventInfo[]} = _(this.document.eventInfos)
			.map(x => ({diff: Math.abs(time - x.sheetTime), sheetEvents: x.sheetEventInfos}))
			.minBy(x => x.diff);
		if (!treffer) {
			return;
		}
		for(const sheetEvent of treffer.sheetEvents) {
			const editor = this.sourceIdEditorMap.get(sheetEvent.sourceId);
			if (!editor) {
				continue;
			}
			editor.addMarkers([sheetEvent]);
		}
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

	/**
	 * 
	 */
	private onPlayerState(old: PlayerState, new_: PlayerState) {
		if (new_ === PlayerState.Stopped) {

		}
		if (new_ === PlayerState.Playing) {

		}
	}

    private updateSourceIdMap(document: IWerckmeisterCompiledDocument) {
        this.sourceIdEditorMap.clear();
        for(const sourceInfo of document.midi.sources) {
            const editor = this.editors.find(ed => '/' + ed.filename === sourceInfo.path);
            if (!editor) {
                continue;
            }
            this.sourceIdEditorMap.set(sourceInfo.sourceId, editor);
        }
    }
    
	/**
	 * 
	 */
	private async onPlayClicked(ev: MouseEvent) {
		this.playerIsFetching = true;
		try {
            const files = this.editors.map(editor => ({
                path: editor.filename,
                data: editor.getScriptText()
            }));
            this.document = await WM_Compiler.compile(files);
            this.updateSourceIdMap(this.document);
		} catch(ex) {
			this.onError(ex.error);
			this.playerIsFetching = true;
			return;
		}
		WM_Player.tempo = this.document.midi.bpm;
		await WM_Player.play(this.document.midi.midiData, ev, this.onMidiEvent.bind(this), this.onPlayerState.bind(this));
		this.playerIsFetching = false;
	}

	/**
	 * 
	 */
	private async onStopClicked(ev: MouseEvent) {
		WM_Player.stop();
		this.clearAllEditorMarkers();
	}

	private clearAllEditorMarkers() {
		for(const editor of this.editors) {
			editor.clearAllMarkers();
		}
	}

	/**
	 * 
	 * @param error 
	 */
	private onError(error: ICompilerError | Error) {
        if (error instanceof Error) {
            console.error(`werckmeister compiler error: ${error}`);
            return;
        }
		console.error(`werckmeister compiler error: ${error.errorMessage}`);
	}


	/**
	 * 
	 */
	private init() {
		this.initListener();
		this.readAttributes()
	}


	private async readAttributes() {
	
    }
    
    public registerEditor(editor: Editor) {
        this.editors.push(editor);
    }
}