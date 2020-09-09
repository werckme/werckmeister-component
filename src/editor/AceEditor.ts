import('../../node_modules/werckmeister-ace-build/src-noconflict/ace');
import('../../node_modules/werckmeister-ace-build/src-min-noconflict/mode-sheet.js');
import('../../node_modules/werckmeister-ace-build/src-min-noconflict/theme-dracula.js');

declare const ace;

import { IMarker, IRange, IToken, IEditor, ICursorPosition, ISelection } from "./IEditor";
// import * as $ from 'jquery';
// import * as _ from 'lodash';
import { Marker } from './Marker';
import { StickyMarker } from './StickyMarker';
    import { MarkerOptions } from './MarkerOptions';
// import { AppConfig } from 'src/config';
// import { EventEmitter } from '@angular/core';

let instances = 0;
let embeddedStyle = "position: absolute; top: 0px; bottom: 0px; left: 0px; right: 0px;";

const ModeMap = {
    "sheet": "ace/mode/sheet",
    "console": "ace/mode/text",
    "text": "ace/mode/text",
    "lua": "ace/mode/lua",
    "snippet": "ace/mode/sheet"
};

const ModeOptions = {
    "console": {
        showGutter: false,
        printMargin: false,
        readOnly: true
    },
    "snippet": {
        highlightActiveLine: false,
        showGutter: false,
        printMargin: false,
        scrollSpeed: 0,
        fixedViewport: true
    }
};

export class AceEdToken implements IToken {
    type: string;
    value: string;
    types: string[];

    constructor(acetoken: any) {
        Object.assign(this, acetoken);
        if (this.type) {
            this.types = this.type.split(" ");
        }
    }

    isType(val: string): boolean {
        if (!this.type) {
            return false;
        }
        return this.types.indexOf(val) >= 0;
    }
}

export class AceEditor implements IEditor {
    aced: any;
    markers: Marker[] = [];
    instanceId = instances++;
    embeddedId: string;
    embeddeSelector: string;
    isFixedViewport: boolean;
    onScrollTopChanged: (val: number) => void;
    onDocumentClick: ()=>void;
    element: HTMLElement;
    constructor() {
        // (window as any).jquery = $;
        // this.embeddedId = `ace-ed-embedded-${this.instanceId}`;
        // this.embeddeSelector = `#${this.embeddedId}`;
        // this.onScrollTopChanged = this.onScrollTopChangedImpl.bind(this);
        // this.onDocumentClick = this.onDocumentClickImpl.bind(this);
    }

    private onDocumentClickImpl(ev: MouseEvent) {
        // let pos = this.aced.renderer.pixelToScreenCoordinates(ev.pageX, ev.pageY);
        // let token = this.getTokenAt(pos.row, pos.column);
        // this.onTokenClicked.emit(new AceEdToken(token));
    }

    get newLine(): string {
        return this.aced.session.getDocument().getNewLineCharacter();
    }

    onScrollTopChangedImpl(val: number) {
        let firstRow = this.aced.renderer.getFirstFullyVisibleRow();
        let lastRow = this.aced.renderer.getLastFullyVisibleRow();
        this.scrollToLine(firstRow);
        let pos = this.getCursorPosition();
        if (pos.row >= lastRow) {
            pos.row = lastRow;
            this.setCursorPosition(pos);
        }
        if (pos.row <= firstRow+1) {
            pos.row = firstRow+1;
            this.setCursorPosition(pos);
        }
    }

    setFixedViewport(val: boolean) {
        if (val === this.isFixedViewport) {
            return;
        }
        this.isFixedViewport = val;
        if (!val) {
            this.aced.session.off("changeScrollTop", this.onScrollTopChanged);
            return;
            
        }
        this.aced.session.on("changeScrollTop", this.onScrollTopChanged);
    }

    getText(): string {
        if (!this.aced) {
            return;
        }
        return this.aced.getSession().getDocument().getValue();
    }

    setText(text: string): Promise<void> {
        return new Promise(resolve =>  {
            if (!this.aced) {
                return;
            }
            this.aced.getSession().getDocument().setValue(text);
            setTimeout(resolve);
        });
    }

    getElement(): any {
        return this.element;
    }

    getCursorPosition(): ICursorPosition
    {
        return this.aced.getCursorPosition() as ICursorPosition;
    }

    setCursorPosition(pos: ICursorPosition) {
        this.aced.gotoLine(pos.row, pos.column);
    }

    scrollToLine(line: number)
    {
        let isFixed = this.isFixedViewport;
        this.setFixedViewport(false);
        this.aced.scrollToLine(line);
        this.setFixedViewport(isFixed);
    }


    private createAceEditor(element: any) {
        this.aced = ace.edit(element);
        this.aced.setTheme("ace/theme/dracula");
        this.aced.session.setMode("ace/mode/sheet");
        //this.aced.on("change", this.aced.$onChangeBackMarker);
        //this.aced.on("change", this.aced.$onChangeFrontMarker);
    }

    detach(): Promise<void> {
        return new Promise((resolve, reject) => {
            let element = this.getElement();
            if (element.length === 0) {
                reject();
                return;
            }
            element.hide();
            resolve();
        });
    }

    attach(element: HTMLElement): Promise<void> {
        this.element = element;
        return new Promise((resolve) => {
            if (this.aced) {
                // $(element).show();
                // this.addListener();
                resolve();
                return;
            }
            this.createAceEditor(element);
            // this.addListener();
            resolve();
        });
    }

    insert(text: string, position?: ICursorPosition): Promise<any> {
        if (!position) {
            this.aced.insert(text);
            return;
        }
        this.aced.session.insert(position, text);
        return new Promise(resolve=>{
            setTimeout(resolve, 500);
        });
    }

    insertLine(str: string, position?: ICursorPosition): Promise<any> {
        return this.insert(str + this.newLine, position);
    }

    selectAll() {
        this.aced.selectAll();
    }

    clearMarkers() {
        for (let marker of this.markers) {
            marker.removeFromEditor();
        }
        this.markers.splice(0, this.markers.length);
    }

    addMarker(marker: IMarker) {
        let mymarker = marker as Marker;
        mymarker.addToEditor(this.aced);
        this.markers.push(mymarker);
    }

    createMarker(range: IRange, options: MarkerOptions = null): IMarker {
        return new StickyMarker(range, options);
    }

    getWordRange(row: number, column: number): IRange {
        return this.aced.session.getWordRange(row, column) as IRange;
    }

    removeMarker(marker_: IMarker) {
        // let marker = marker_ as Marker;
        // let idx = _.indexOf(this.markers, marker);
        // marker.removeFromEditor();
        // this.markers.splice(idx, 1);
    }

    getTokenAt(row: number, column: number): IToken {
        return this.aced.session.getTokenAt(row, column) as IToken;
    }

    getTokenRange(row: number, column: number, tokenType: string): IRange
    {
        return null;
        // let token = this.getTokenAt(row, column);
        // let tokenLength = token.value ? token.value.length : 0;
        // unfortunately aced.getToken will not find events stating with " or <
        // so we have to search it for our own
        // let hasType = (x:any) => !!x.type && x.type.indexOf(tokenType) >= 0;
        // let tokens = this.aced.getSession().getTokens(row);
        // let tokencol = 0;
        // let getTokenColumn = (x) => {
        //     let res = tokencol;
        //     tokencol += x.value.length;
        //     return res;
        // };
        // let token = _(tokens)
        //         .find(x => hasType(x) && getTokenColumn(x) >= column);
        // if (!token) {
        //     return this.createRange(row, column, row, column + 2);
        // }
        // return this.createRange(row, column, row, column + 1); //token.value.length);
    }

    onDocumentChanged(callback: ()=>void) {
        this.aced.getSession().getDocument().on("change", callback);
    }

    offDocumentChanged(callback: ()=>void) {
        this.aced.getSession().getDocument().off("change", callback);
    }

    resetHistory() {
        this.aced.getSession().getUndoManager().reset();
    }

    setMode(mode: string) {
        let acemode = ModeMap[mode];
        if (!acemode) {
            throw new Error(`ace mode: ${mode} not found`);
        }
        this.aced.session.setMode(acemode);
        let modeOptions = ModeOptions[mode];
        if (!modeOptions) {
            return;
        }
        this.aced.setOptions(modeOptions);
        this.setFixedViewport(modeOptions.fixedViewport);
    }

    setTheme(theme: string) {
        this.aced.setTheme(`ace/theme/${theme}`);
    }

    onResize() {
        if (!this.aced || !this.aced.renderer) {
            return;
        }
        this.aced.renderer.onResize(true);
    }

    getLines(firstRow:number, lastRow:number): string[] {
        return this.aced.session.getLines(firstRow, lastRow);
    }

    getSelection(): ISelection {
        return this.aced.session.getSelection();
    }

    createRange(fromRow: number, fromCol: number, toRow: number, toCol: number): IRange {
        return new ace.Range(fromRow, fromCol, toRow, toCol);
    }
    
    replace(range: IRange, text: string) {
        this.aced.session.replace(range, text);
    }

    undo() {
        this.aced.undo();
    }

    redo() {
        this.aced.redo();
    }

    getNumRows(): number {
        return this.aced.session.getDocument().getLength();
    }

    getTokensAtRow(row: number): IToken[] {
        var tokens: any[] = this.aced.session.getTokens(row);
        return tokens.map(x => new AceEdToken(x));
    }

    select(range: IRange) {
        this.aced.session.getSelection().setSelectionRange(range);
    }
}

