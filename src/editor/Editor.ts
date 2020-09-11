declare const require;
const CodeMirror = require("codemirror/lib/codemirror.js");

export class Editor {
    private editor: CodeMirror.Editor;
    /**
     * 
     * @param element 
     * @param value 
     */
    constructor(element: HTMLElement, value: string = "") {
        this.editor = CodeMirror(element, {
            value: value
        });
        this.editor.markText({line: 1, ch: 0}, {line: 1, ch: 5}, {className: 'wm-marked'})
    }

    getValue(): string {
        return this.editor.getValue();
    }
}