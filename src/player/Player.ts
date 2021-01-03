declare const require;


import { Quarters } from "../shared/types";
import * as _ from 'lodash';
import { PlayerState } from "../shared/player";
import { WerckmeisterMidiPlayer } from 'werckmeister-midiplayer';
import { IMidiEvent } from "werckmeister-midiplayer/IMidiEvent";
import { MidiEvent } from "../shared/midiEvent";

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
    private onMidiEvent: MidiEventCallback|null = null;
    private onPlayerState: PlayerStateChangedCallback|null = null;
    private state: PlayerState = PlayerState.Stopped;
    /**
     * 
     * @param event 
     */
    private getPlayer(event: MouseEvent | KeyboardEvent): any {
        if (!this._player) {
            this._player = new WerckmeisterMidiPlayer();
            this._player.initAudioEnvironment(event);
            this._player.onMidiEvent = this.onEvent.bind(this);
        }
        return this._player;
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
        // TODO:
		// if (this.onPlayerState && playerEvent.now >= playerEvent.end) {
		// 	this.onStop();
		// }
    }

    /**
     * 
     * @param midiBase64 
     * @param player 
     */
    private async loadFile(midiBase64: string, player): Promise<void> {
        await player.load(midiBase64);
    }
    
    /**
     * 
     * @param midiBase64 
     * @param event needed to initiate sound output
     */
    async play(midiBase64: string, event: MouseEvent | KeyboardEvent, onMidiEvent: MidiEventCallback = null, onPlayerState: PlayerStateChangedCallback = null) {
        const player = await this.getPlayer(event);
        try {
            await this.loadFile(midiBase64, player);
        } catch (ex) {
            this._currentMidifile = null;
            console.error(ex);
        }
        if (this.onPlayerState) {
            this.onStop();
        }
        this.onMidiEvent = onMidiEvent;
        this.onPlayerState = onPlayerState;
        this.onPlay();
        player.play();
	}

    onStop() {
        this.onPlayerState(this.state, PlayerState.Stopped);
        this.state = PlayerState.Stopped;
    }

    onPlay() {
        this.onPlayerState(this.state, PlayerState.Playing);
        this.state = PlayerState.Playing; 
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
        this.onMidiEvent = null;
        this.onPlayerState = null;
	}

}