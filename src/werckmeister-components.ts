import { Snippet } from './components/snippet/Snippet';
declare const require;
require("babel-core/register");
require("babel-polyfill");


window.customElements.define('werckmeister-snippet', Snippet);