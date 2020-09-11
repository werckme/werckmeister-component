declare const require;
require("../mudcube/js/midi/audioDetect.js");
require("../mudcube/js/midi/gm.js");
require("../mudcube/js/midi/loader.js");
require("../mudcube/js/midi/plugin.audiotag.js");
require("../mudcube/js/midi/plugin.webaudio.js");
require("../mudcube/js/midi/plugin.webmidi.js");
require("../mudcube/js/midi/player.js");
require("../mudcube/js/midi/synesthesia.js");
require("../mudcube/js/util/dom_request_xhr.js");
require("../mudcube/js/util/dom_request_script.js");

import { Quarters } from "../shared/types";
import * as _ from 'lodash';
import { MidiEvent } from "../shared/midiEvent";
import { MidiFile } from "../mudcube/inc/jasmid/midifile.js";

declare const MIDI: any;

const DeltaBugFixOffset = 1;

const soundfontUrl = "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/";

/**
 * the tick values of MIDI.js seems only to be correct if 
 * the bpm = 120
 * @param ticks 
 * @param tempo 
 */
function fixBrokenTicks(ticks:number, tempo: number): Quarters {
	if (tempo === 0) {
		return 0;
	}
	return ticks * (tempo / 120);
}

export interface IMidiplayerEvent {
	position: Quarters;
	midiEvent: MidiEvent;
}

export class Player {
    private _player: any;
    private _currentMidifile: any;
    public tempo = 120;
    /**
     * 
     * @param event 
     */
    private getPlayer(event: MouseEvent | KeyboardEvent): Promise<any> {
		if (this._player) {
			return this._player;
        }
		return new Promise((resolve, reject) => {
			MIDI.loadPlugin({
				soundfontUrl: soundfontUrl,
				instrument: 'acoustic_grand_piano',		
				onerror: reject,
				onsuccess: () => {
					this._player = MIDI.Player;
					resolve(this._player);
					MIDI.Player.addListener(this.onEvent.bind(this));
				}
			});
		});
    }

    /**
     * 
     * @param playerEvent 
     */
    onEvent(playerEvent: any) {
    }

    /**
     * 
     * @param midiBase64 
     * @param player 
     */
    private loadFile(midiBase64: string, player): Promise<void> {
		return new Promise((resolve, reject) => {
			player.loadFile('base64,' + midiBase64, resolve, undefined, reject);
		}).then(() => {
			this._currentMidifile = MidiFile(player.currentData);
		});
    }
    
    /**
     * 
     * @param midiBase64 
     * @param event needed to initiate sound output
     */
    async play(midiBase64: string, event: MouseEvent | KeyboardEvent) {
        console.log("init player");
        const player = await this.getPlayer(event);
        player.BPM = this.tempo;
        console.log("done");
        try {
            await this.loadFile(midiBase64, player);
        } catch (ex) {
            this._currentMidifile = null;
            console.error(ex);
        }
		player.stop();
        player.start();
	}

    /**
     * 
     */
	async stop() {
		const player = await this.getPlayer(null);
		player.stop();
	}

}