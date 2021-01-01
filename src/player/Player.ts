declare const require;


import { Quarters } from "../shared/types";
import * as _ from 'lodash';
import { PlayerState } from "../shared/player";
import { WerckmeisterMidiPlayer } from 'werckmeister-midiplayer';

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
        }
        return this._player;
    }

    /**
     * 
     * @param playerEvent 
     */
    onEvent(playerEvent: any) {
        // const ticks = playerEvent.now - DeltaBugFixOffset;
		// const ppq = this._currentMidifile.header.ticksPerBeat;
		// const position = fixBrokenTicks(ticks, this.tempo) / ppq;
		// const midiEvent = new MidiEvent();
		// // tslint:disable-next-line: no-bitwise
		// midiEvent.eventType = playerEvent.message >> 4;
		// midiEvent.parameter1 = playerEvent.note;
		// midiEvent.parameter2 = playerEvent.velocity;
        // midiEvent.channel = playerEvent.channel;
        // if (this.onMidiEvent) {
        //     this.onMidiEvent({position, midiEvent});
        // }
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
        // TODO currentMidiFile
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