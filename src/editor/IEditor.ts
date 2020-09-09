
export interface ITextPosition {
    row: number;
    column: number;
}

export interface IRange {
    start: ITextPosition;
    end: ITextPosition;
}
import {AceEditor} from './AceEditor';

export interface ISelection {
    getRange(): IRange;
    isEmpty(): boolean;
}

export interface ICursorPosition {
    row: number;
    column: number;
}

export interface IMarker {
    id: any;
    range: IRange;
    marked: boolean;
    setMarked(val: boolean);
}

export interface IToken {
    value: string;
    types: string[];
    isType(val: string): boolean;
}

export interface IEditor {
    newLine: string;
    getText(): string;
    setText(text: string): Promise<void>;
    setMode(mode: string);
    setTheme(theme: string);
    insert(str: string, position?: ICursorPosition): Promise<void>;
    insertLine(str: string, position?: ICursorPosition): Promise<void>;
    getCursorPosition(): ICursorPosition;
    setCursorPosition(pos: ICursorPosition);
    scrollToLine(line: number);
    selectAll();
    clearMarkers();
    addMarker(marker: IMarker);
    getLines(firstRow:number, lastRow:number): string[];
    getSelection(): ISelection;
    //createMarker(range: IRange, options: MarkerOptions): IMarker;
    getWordRange(row: number, column: number): IRange;
    getTokenRange(row: number, column: number, tokenType: string): IRange;
    getTokenAt(row: number, column: number): IToken;
    createRange(fromRow: number, fromCol: number, toRow: number, toCol: number): IRange;
    replace(range: IRange, text: string);
    removeMarker(marker: IMarker);
    detach(): Promise<void>;
    attach(element: string | any): Promise<void>;
    onDocumentChanged(callback: ()=>void);
    offDocumentChanged(callback: ()=>void);
    resetHistory();
    onResize();
    undo();
    redo();
    getNumRows(): number;
    getTokensAtRow(row: number): IToken[];
    select(range: IRange);
    //onTokenClicked: EventEmitter<IToken>;
}

export function createNewEditor(): IEditor {
    return new AceEditor();
}