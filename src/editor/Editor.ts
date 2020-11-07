declare const require;
const CodeMirror = require("codemirror/lib/codemirror.js");
require("./SheetMode");

export interface IMarker {
    /**
     * removes marker
     */
    clear();
}

export type DocumentIndex = number;

export class Editor {
    private editor: CodeMirror.Editor;
    private eventMarkClass = "wm-marked";
    private errorClass = "wm-error";
    /**
     * 
     * @param element 
     * @param value 
     */
    constructor(element: HTMLElement, value: string = "") {
        this.editor = CodeMirror(element, {
            value: value
        });
    }

    /**
     * 
     */
    getValue(): string {
        return this.editor.getValue();
    }

    /**
     * 
     */
    setValue(text: string) {
        this.editor.setValue(text);
    }

    /**
     * 
     */
    clearMarkers() {
        const allMarks = this.editor.getAllMarks();
        for(const mark of allMarks) {
            mark.clear();
        }
    }

    /**
     * 
     * @param from 
     * @param to 
     */
    private setMarker(from: DocumentIndex, to: DocumentIndex, className: string): IMarker {
        const begin = this.editor.posFromIndex(from);
        const end = this.editor.posFromIndex(to);
        const marker = this.editor.markText(begin, end, {className});
        return marker;
    }

    /**
     * 
     * @param from 
     * @param to 
     */
    setEventMarker(from: DocumentIndex, to: DocumentIndex): IMarker {
        return this.setMarker(from, to, this.eventMarkClass)
    }

    /**
     * 
     * @param from 
     * @param to 
     */
    setErrorMarker(from: DocumentIndex, to: DocumentIndex): IMarker {
        return this.setMarker(from, to, this.errorClass)
    }

    /**
     * 
     */
    update() {
        this.editor.refresh();
    }

    isClean() {
        return this.editor.isClean();
    }

    markClean() {
        this.editor.markClean();
    }
}