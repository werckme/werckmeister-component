import { EnvironmentType, IEnvironmentInspector, MidiDeviceInfo } from "@werckmeister/language-features/IEnvironmentInspector";
import _ = require("lodash");

export const SoundFontRepoMap = {
    "choriumreva": "https://raw.githubusercontent.com/werckme/soundfont-server/main/soundfonts/choriumreva/choriumreva.sf2.json",
    "FluidR3_GM": "https://raw.githubusercontent.com/werckme/soundfont-server/main/soundfonts/FluidR3_GM_EX/FluidR3_GM_EX.sf2.json"
};

export class EnvironmentInspector implements IEnvironmentInspector {
    environment: EnvironmentType = "web";
    async getMidiOutputDevices(): Promise<MidiDeviceInfo[]> {
        return [];
    }
    webplayerPresets: string[] = _.keys(SoundFontRepoMap)
}