import { WerckmeisterCompiler } from './compiler/Compiler';
import { Player } from './player/Player';

export let WM_Compiler = new WerckmeisterCompiler();
export const WM_Player = new Player();

/**
 * avoid strange memory issues (compiler crashes randomly, browser tab crash)
 */
export async function resetCompiler(): Promise<void> {
    WM_Compiler = new WerckmeisterCompiler();
}