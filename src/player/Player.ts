declare const require;


import { Quarters } from "../shared/types";
import * as _ from 'lodash';
import { WerckmeisterMidiPlayer,PlayerState as MidiPlayerState, TaskVisitor } from '@werckmeister/midiplayer';
import { IMidiEvent } from "werckmeister-midiplayer/IMidiEvent";
import { MidiEvent } from "../shared/midiEvent";
import { PlayerState } from "../shared/player";
import { IDeviceInfo, IWerckmeisterCompiledDocument } from "../compiler/Compiler";
import { SoundFontRepoMap } from "../components/editor/EnvironmentInspector";

declare const MIDI: any;


export interface IMidiplayerEvent {
	position: Quarters;
	midiEvent: any;
}

export type MidiEventCallback = (event: IMidiplayerEvent) => void;
export type PlayerStateChangedCallback = (oldState: PlayerState, newState: PlayerState) => void;

export class Player {
    private _player: WerckmeisterMidiPlayer;
    private _currentMidifile: any;
    public tempo = 120;
    public playerTaskVisitor: TaskVisitor;
    private onMidiEvent: MidiEventCallback|null = null;
    private onPlayerStateChangedCallback: PlayerStateChangedCallback|null = null;
    private state: PlayerState = PlayerState.Stopped;
    private repoUrl: string = null;
    private repoMap = SoundFontRepoMap;
    
    /**
     * 
     * @param event 
     */
    private async getPlayer(event: MouseEvent | KeyboardEvent): Promise<WerckmeisterMidiPlayer> {
        if (!this._player) {
            this._player = new WerckmeisterMidiPlayer();
            await this._player.initAudioEnvironment(event);
            this._player.onMidiEvent = this.onEvent.bind(this);
            this._player.onPlayerStateChanged = this._onPlayerStateChanged.bind(this);
            if (this.repoUrl) {
                this._player.setRepoUrl(this.repoUrl);
            }
        }
        return this._player;
    }

    public async prepare(event: MouseEvent | KeyboardEvent): Promise<void> {
        await this.getPlayer(event);
    }

    public setRepoUrl(url: string) {
        this._player.setRepoUrl(url);
    }

    private _onPlayerStateChanged(old: MidiPlayerState, _new: MidiPlayerState) {
		if (_new === MidiPlayerState.Stopped) {
            this.onStop();
		}
    }

    /**
     * 
     * @param playerEvent 
     */
    onEvent(playerEvent: IMidiEvent) {
        const ticks = playerEvent.absPositionTicks;
		const midiEvent = new MidiEvent();
		// tslint:disable-next-line: no-bitwise
		midiEvent.eventType = playerEvent.type;
		midiEvent.parameter1 = playerEvent.param1;
		midiEvent.parameter2 = playerEvent.param2;
        midiEvent.channel = playerEvent.channel;
        if (this.onMidiEvent) {
            this.onMidiEvent({position: ticks/this._player.ppq, midiEvent});
        }
    }

    /**
     * 
     * @param midiBase64 
     * @param player 
     */
    private async loadFile(midiBase64: string, player: WerckmeisterMidiPlayer): Promise<void> {
        await player.load(midiBase64, this.playerTaskVisitor);
    }
    
    /**
     * 
     * @param midiBase64 
     * @param event needed to initiate sound output
     */
    public async play(midiBase64: string, event: MouseEvent | KeyboardEvent, onMidiEvent: MidiEventCallback = null, onPlayerState: PlayerStateChangedCallback = null) {
        const player = await this.getPlayer(event);
        try {
            await this.loadFile(midiBase64, player);
        } catch (ex) {
            this._currentMidifile = null;
            console.error(ex);
        }
        if (this.onPlayerStateChangedCallback) {
            this.onStop();
        }
        this.onMidiEvent = onMidiEvent;
        this.onPlayerStateChangedCallback = onPlayerState;
        this.onPlay();
        await player.play();
	}

    public setDevice(device: IDeviceInfo) {
        const deviceUrl = device.fontName.trim();
        if (deviceUrl.startsWith('https://')) {
            this.setRepoUrl(deviceUrl);
            return;
        }
        const repoUrl = this.repoMap[device.fontName];
        if (!repoUrl) {
            throw new Error(`unknown font for device ${device.name}. Possible values are ${_.keys(this.repoMap).map(x => `"${x}"`).join(", ")}`);
        }
        this.setRepoUrl(repoUrl);
    }

    public prepareDevices(document: IWerckmeisterCompiledDocument) {
        if (!document.midi.devices || document.midi.devices.length === 0) {
            return;
        }
        if(document.midi.devices?.length > 1) {
            throw new Error(`only one device is supported you defined ${document.midi.devices.length}.`);
        }
        this.setDevice(_.first(document.midi.devices));
    }

    onStop() {
        if (this.onPlayerStateChangedCallback) {
            this.onPlayerStateChangedCallback(this.state, PlayerState.Stopped);
        }
        this.state = PlayerState.Stopped;
        this.onMidiEvent = null;
        this.onPlayerStateChangedCallback = null;
    }

    onPlay() {
        this.onPlayerStateChangedCallback(this.state, PlayerState.Playing);
        this.state = PlayerState.Playing;
    }

    setSoundfontRepoUrl(url: string) {
        if(this._player) {
            this._player.setRepoUrl(url);
        } 
        this.repoUrl = url;
    }

    /**
     * 
     */
	async stop() {
        if (this.state === PlayerState.Stopped) {
            return;
        }
        this.onStop();
		const player = await this.getPlayer(null);
        player.stop();
	}

}