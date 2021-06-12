import { WM_Compiler, WM_Player } from '../../Global';
import { IMidiplayerEvent } from '../../player/Player';
import { EventType } from '../../shared/midiEvent';
import { IWerckmeisterCompiledDocument, ICompilerError, SheetEventInfo, ICompilerWarning } from '../../compiler/Compiler';
import { PlayerState } from '../../shared/player';
import { Editor } from '../editor/Editor';
import { fetchText } from '../../shared/http';
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
	public onError = (error: ICompilerError) => {};
	public onWarnings = (warnings: ICompilerWarning[]) => {};
	public onCompiled = (document: IWerckmeisterCompiledDocument):void => {};
	public onStateChanged = (old: PlayerState, new_: PlayerState):void => {};
	public updateMarkersDebounceMillis: number = 50;
    private _playerIsFetching: boolean;
    private editors: Editor[] = [];
    private sourceIdEditorMap: Map<number, Editor> = new Map<number, Editor>();
	private lastEventTimeQuarters:number = 0;
	private updateMarkersDebounced = _.debounce(this.updateMarkersImpl.bind(this), this.updateMarkersDebounceMillis);
	private _beginQuarters : number = 0;
	public get beginQuarters() : number {
		return this._beginQuarters;
	}
	public set beginQuarters(v : number) {
		this._beginQuarters = Math.max(0, v);
	}
	

	getEditorByFileName(filename: string): Editor|undefined {
		const filenames = this.editors
			.map(x => `/${x.filename}`);
		const idx = filenames.indexOf(filename);
		if (idx < 0) {
			return undefined;
		}
		return this.editors[idx];
	}

	set playerIsFetching(val: boolean) {
		this._playerIsFetching = val;
		const snippetEl = this.workspaceControlsElement;
		if (val) {
			snippetEl.classList.add("wm-player-fetching");
		} else {
			snippetEl.classList.remove("wm-player-fetching");
		}
	}
	
	get playerIsFetching(): boolean {
		return this._playerIsFetching;
	}

	public playerState: PlayerState = PlayerState.Stopped;

	private get workspaceControlsElement(): HTMLElement {
		return this.shadowRoot.getElementById("wm-controls");
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

	private async createElement(): Promise<void> {
		this.attachShadow({ mode: 'open' });
		const newNode = template.content.cloneNode(true);
		this.shadowRoot.appendChild(newNode);
		setTimeout(this.init.bind(this));
	}

	/**
	 * 
	 */
	private initListener(): void {
		const playCta = this.playButtonElement;
		playCta.addEventListener("click", this.onPlayClicked.bind(this));
		const stopCta = this.stopButtonElement;
		stopCta.addEventListener("click", this.onStopClicked.bind(this));
	}

	/**
	 * 
	 * @param time 
	 */
	private updateMarkers(time: number): void {
		this.lastEventTimeQuarters = time;
		this.updateMarkersDebounced();
	}

	private updateMarkersImpl(): void {
		const time = this.lastEventTimeQuarters;
		this.clearAllEventMarkers();
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
            this.updateMarkers(ev.position + this.beginQuarters);
		}
	}

	/**
	 * 
	 */
	private onPlayerState(old: PlayerState, new_: PlayerState) {
		if (new_ === PlayerState.Stopped) {
			this.clearAllEventMarkers();
			this.workspaceControlsElement.classList.remove("wm-state-playing");
			this.workspaceControlsElement.classList.add("wm-state-stopped");
		}
		if (new_ === PlayerState.Playing) {
			this.workspaceControlsElement.classList.remove("wm-state-stopped");
			this.workspaceControlsElement.classList.add("wm-state-playing");
		}
		this.playerState = new_;
		this.onStateChanged(old, new_);
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
	private onPlayClicked(ev: MouseEvent) {
		this.play(ev);
	}

		/**
	 * 
	 */
	public async play(ev: MouseEvent | KeyboardEvent) {
		this.playerIsFetching = true;
		this.onPlayerState(this.playerState, PlayerState.Preparing);
		setTimeout(async () => {
			try {
				const files = this.editors.map(editor => ({
					path: editor.filename,
					data: editor.getScriptText()
				}));
				this.clearAllEditorMarkers();
				this.document = await WM_Compiler.compile(files, this.beginQuarters);
				this.onCompiled(this.document);
				this.updateSourceIdMap(this.document);
				if(this.document.midi.warnings && this.document.midi.warnings.length > 0) {
					this._onWarnings(this.document.midi.warnings);
				}
			} catch(ex) {
				this._onError(ex.error || ex);
				this.playerIsFetching = false;
				this.onPlayerState(this.playerState, PlayerState.Stopped);
				return;
			}
			WM_Player.tempo = this.document.midi.bpm;
			await WM_Player.play(this.document.midi.midiData, ev, this.onMidiEvent.bind(this), this.onPlayerState.bind(this));
			this.playerIsFetching = false;
		});
	}

	public async download(filename: string = "WerckmeisterMidi.mid") {
		try {
            const files = this.editors.map(editor => ({
                path: editor.filename,
                data: editor.getScriptText()
			}));
			this.document = await WM_Compiler.compile(files);
		} catch(ex) {
			this._onError(ex.error || ex);
			return;
		}
		const linkSource = `data:midi;base64,${this.document.midi.midiData}`;
		const downloadLink = document.createElement("a");
		downloadLink.href = linkSource;
		downloadLink.download = filename;
		downloadLink.click();
	}

	/**
	 * 
	 */
	private onStopClicked(_ev: MouseEvent) {
		this.stop();
	}

	/**
	 * 
	 */
	public async stop() {
		await WM_Player.stop();
	}

	private clearAllEditorMarkers() {
		for(const editor of this.editors) {
			editor.clearAllMarkers();
		}
	}

	private clearAllEventMarkers() {
		for(const editor of this.editors) {
			editor.clearEventMarkers();
		}
	}

	/**
	 * 
	 * @param error 
	 */
	private _onError(error: ICompilerError | Error) {
        if (error instanceof Error) {
            console.error(`${error}`);
            return;
		}
		this.onError(error);
		console.error(`${error.sourceFile}": ${error.errorMessage}`);
		const editor = this.getEditorByFileName(error.sourceFile);
		if (!editor) {
			return;
		}
		editor.setError(error);
	}


	private _onWarnings(warnings: ICompilerWarning[]) {
		for(const warning of warnings) {
			console.warn(warning.message);
			const editor = this.getEditorByFileName(warning.sourceFile);
			editor.addWarning(warning);
		}
		this.onWarnings(warnings);
	}

	/**
	 * 
	 */
	private init() {
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
		const onError = this.attributes.getNamedItem("wm-onerror");
		if (onError) {
			console.error(onError)
		}
		const cssRefAttr = this.attributes.getNamedItem("wm-css-url");
		if (cssRefAttr) {
			this.loadExternalCss(cssRefAttr.value);
		}
		const soundfontRepoUrl = this.attributes.getNamedItem("wm-soundfont-url");
		if (soundfontRepoUrl) {
			WM_Player.setSoundfontRepoUrl(soundfontRepoUrl.value);
		}			
    }
    
    public registerEditor(editor: Editor) {
        this.editors.push(editor);
	}
	
	public unregisterEditor(editor: Editor) {
		const idx = this.editors.indexOf(editor);
		if (idx < 0) {
			return;
		}
		this.editors.splice(idx, 1);
	}
	
	isClean() {
        return _.every(this.editors, (editor) => editor.isClean());
    }

    markClean() {
        for(const editor of this.editors) {
			editor.markClean();
		}
    }
}