import { PlayerState as _PlayerSate} from "@werckmeister/midiplayer";

export enum PlayerState {
    Stopped = _PlayerSate.Stopped,
    Preparing = _PlayerSate.Preparing,
    Playing = _PlayerSate.Playing,
    Stopping = _PlayerSate.Stopping
}
