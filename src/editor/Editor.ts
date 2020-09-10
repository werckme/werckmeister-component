declare const require;
const CodeMirror = require("codemirror/lib/codemirror.js");

export class Editor {
    editor: any;
    constructor(element: HTMLElement, value: string = "") {
        this.editor = CodeMirror(element, {
            value: value
        });
    }
}