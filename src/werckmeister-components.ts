// @werckmeister/midiplayer and @werckmeister/language-features are babel
// builds that expect a global regeneratorRuntime (formerly from babel-polyfill).
// Must stay the first import.
import 'regenerator-runtime/runtime';
import { Editor } from './components/editor/Editor';
import { Snippet } from './components/snippet/Snippet';
import { Workspace } from './components/workspace/Workspace';

window.customElements.define('werckmeister-snippet', Snippet);
window.customElements.define('werckmeister-workspace', Workspace);
window.customElements.define('werckmeister-editor', Editor);