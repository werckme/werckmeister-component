declare const require;
const CodeMirror = require("codemirror/lib/codemirror.js");

export class Editor {
    editor: CodeMirror.Editor;
    constructor(element: HTMLElement, value: string = "") {
        this.editor = CodeMirror(element, {
            value: value
        });
        this.editor.markText({line: 1, ch: 0}, {line: 1, ch: 5}, {className: 'wm-marked'})
    }
}