
import { WerckmeisterCompiler } from './compiler/Compiler';
import { Player } from './player/Player';
import { WM_Compiler, WM_Player } from './Global';
import { Snippet } from './components/snippet/Snippet';
declare const require;
require("babel-core/register");
require("babel-polyfill");





window.customElements.define('werckmeister-snippet', Snippet);