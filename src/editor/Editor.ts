import { ILanguageFeatures, IPathSuggestion, ISuggestion } from "@werckmeister/language-features";
import { ActiveSourceDocument } from "./SourceDocumentImpl";
import * as _ from 'lodash';

declare const require;
const CodeMirror = require("codemirror/lib/codemirror.js");
require('codemirror/addon/hint/show-hint.js');
require('codemirror/mode/lua/lua.js');
require("./SheetMode");
require("./ConductionsSheetMode");

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
    lua = 'lua',
    conductions = 'conductions'
}
/**
 * find out what of the hint is already written in the line
 * @param line 
 * @param hint 
 */
function whatIsAlreadyWritten(line: string, hint: string) {
    // find matching tail: /(t?h?h?e?T?a?i?l?)$/
    let regexStr = _.map(hint, ch => `${ch}?`).join('');
    regexStr = regexStr.replace(/\./g, '\\.')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\[/g, '\\[')
    .replace(/\[/g, '\\]')
    ;
    const tailRegex = new RegExp(`(${regexStr})$`, 'g');
    const matchingTail = (line.match(tailRegex) || [])[0];
    return matchingTail;
}

/**
 * returns all characters after `_parameter=`
 * @param line 
 * @param hint 
 */
function whatParameterValueIsAlreadyWritten(line: string, hint: string) {
    return (line.match(/.*="?(.*)/) || [])[1];
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
            const suggestionClassName = (x: ISuggestion) => {
                if ((x as IPathSuggestion).file) {
                    return (x as IPathSuggestion).file.isDirectory ? "isFolder" : "isFile"
                }
                return "";
            }
            const hints = {
                list: suggestions.map(x => ({text: x.displayText, replaceText: x.text, isValueSuggestion: !!(x as any).parameter,
                    className: suggestionClassName(x),
                    hint: (cm, x, suggestion) => {
                        const isValue = suggestion.isValueSuggestion;
                        const line:string = cm.getRange({line:cur.line, ch:0}, {line: cur.line, ch: cur.ch});
                        let hint:string = suggestion.replaceText;
                        const matchingTail = isValue ? whatParameterValueIsAlreadyWritten(line, hint) : whatIsAlreadyWritten(line, hint);
                        let cutoff = (matchingTail || "").length;
                        const colStart = start - cutoff;
                        let colEnd = start + cutoff;
                        if (colStart !== colEnd) {
                            colEnd -= 1;
                        }
                        cm.replaceRange(suggestion.replaceText, 
                            CodeMirror.Pos(cur.line, colStart), 
                            CodeMirror.Pos(cur.line, colEnd));
                    }
                })),
                from: CodeMirror.Pos(cur.line, start),
                to: CodeMirror.Pos(cur.line, end),
            };
            return hints;
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
            "'/'": replaceAndShowAutoComplete.bind(null, '/'),
            "'_'": replaceAndShowAutoComplete.bind(null, '_'),
            "'='": replaceAndShowAutoComplete.bind(null, '=')
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
        return this.setMarker(from, to, this.eventMarkClass, {"wm-doc-pos": from})
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