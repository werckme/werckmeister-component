import { Editor } from './components/editor/Editor';
import { Snippet } from './components/snippet/Snippet';
import { Workspace } from './components/workspace/Workspace';

window.customElements.define('werckmeister-snippet', Snippet);
window.customElements.define('werckmeister-workspace', Workspace);
window.customElements.define('werckmeister-editor', Editor);