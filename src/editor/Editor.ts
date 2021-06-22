import { ILanguageFeatures, IPathSuggestion } from "@werckmeister/language-features";
import { ActiveSourceDocument } from "./SourceDocumentImpl";
import * as _ from 'lodash';

declare const require;
const CodeMirror = require("codemirror/lib/codemirror.js");
require('codemirror/addon/hint/show-hint.js');
require('codemirror/mode/lua/lua.js');
require("./SheetMode");

export interface IMarker {
    /**
     * removes marker
     */
    clear();
}

const CodemirrorTheme = "base16-dark";

export type DocumentIndex = number;

export interface EditorOptions {
    theme?: string,
    lineNumbers?: boolean
}

export enum Mode {
    sheet = 'sheet',
    text = 'text',
    lua = 'lua'
}

export class Editor {
    private editor: CodeMirror.Editor;
    private eventMarkClass = "wm-marked";
    private errorClass = "wm-error";
    private warningClass = "wm-warning";
    private languageFeatures: ILanguageFeatures;
    /**
     * 
     * @param element 
     * @param value 
     */
    constructor(private element: HTMLElement, value: string = "", options?: EditorOptions) {
        options = options || { theme: "default" };
        this.editor = CodeMirror(element, {
            value: value,
            theme: options.theme,
            mode: Mode[Mode.sheet],
            lineNumbers: options.lineNumbers
        });
    }

    public activateAutoCompletion(languageFeatures_: ILanguageFeatures, fileName: string): void {
        this.languageFeatures = languageFeatures_;
        CodeMirror.registerHelper('hint', 'wmAutoComplete', async (editor, options) => {
            const cur = editor.getCursor();
            const end = cur.ch,
                start = end;
            const document = new ActiveSourceDocument(editor, fileName);
            const suggestions = await this.languageFeatures.autoComplete(document);
            return {
                list: suggestions.map(x => ({text: x.text, 
                    className: (x as IPathSuggestion).file.isDirectory ? "isFolder" : "isFile",
                    hint: (cm, x, suggestion) => {
                        const line:string = cm.getLine(cur.line);
                        const hint:string = suggestion.text;
                        // find matching tail: /(t?h?h?e?T?a?i?l?)$/
                        const tailRegex = new RegExp(`(${_.map(hint, ch => `${ch}?`).join('')})$`, 'g');
                        const matchingTail = (line.match(tailRegex) || [])[0];
                        const cutoff = (matchingTail || "").length
                        console.log(suggestion.text, matchingTail, cutoff)
                        cm.replaceRange(suggestion.text, 
                            CodeMirror.Pos(cur.line, start - cutoff), 
                            CodeMirror.Pos(cur.line, start + cutoff));
                    }
                })),
                from: CodeMirror.Pos(cur.line, start),
                to: CodeMirror.Pos(cur.line, end),
            };
        });
        CodeMirror.commands.autocomplete = (cm) => {
            cm.showHint({
                hint: CodeMirror.hint.wmAutoComplete,
                container: this.element
            });
        };
        const replaceAndShowAutoComplete = (charToMatch: string, cm) => {
            var curretCursorPosition = cm.getCursor();
            cm.replaceRange(charToMatch, curretCursorPosition);
            CodeMirror.commands.autocomplete(cm);
        };

        this.editor.setOption("extraKeys", {
            'Ctrl-Space': 'autocomplete',
            "'\"'": replaceAndShowAutoComplete.bind(null, '"'),
            "'/'": replaceAndShowAutoComplete.bind(null, '/')
        });
    }

    setMode(mode: Mode) {
        if (mode === Mode.text) {
            this.editor.setOption("mode", null);
            return;
        }
        this.editor.setOption("mode", Mode[mode]);
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
    clearEventMarkers() {
        const allMarks = this.editor.getAllMarks();
        for (const mark of allMarks) {
            if (mark.className === this.warningClass || mark.className === this.errorClass) {
                continue;
            }
            mark.clear();
        }
    }

    /**
     * 
     */
    clearAllMarkers() {
        const allMarks = this.editor.getAllMarks();
        for (const mark of allMarks) {
            mark.clear();
        }
    }

    /**
     * 
     * @param from 
     * @param to 
     */
    private setMarker(from: DocumentIndex, to: DocumentIndex, className: string, attributes: object = undefined): IMarker {
        const begin = this.editor.posFromIndex(from);
        const end = this.editor.posFromIndex(to + 1);
        const marker = this.editor.markText(begin, end, { className, attributes });
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
     * @param from 
     * @param to 
     */
    setWarningMarker(message: string, from: DocumentIndex, to: DocumentIndex): IMarker {
        return this.setMarker(from, to, this.warningClass, { title: message })
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

    clearHistory() {
        this.editor.clearHistory();
    }
}