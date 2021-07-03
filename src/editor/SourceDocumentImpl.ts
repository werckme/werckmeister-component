import { Cursor, IActiveSourceDocument, ISourceDocument } from "@werckmeister/language-features";

type CodeMirrorEditor = any;

function toCMCursor(cursor: Cursor) {
    return {line: cursor.line, ch: cursor.col};
}

export class SourceDocument implements ISourceDocument {
    constructor(protected editor: CodeMirrorEditor, protected fileName: string) {}
    public async getRange(from: Cursor, to: Cursor): Promise<string> {
        return this.editor.getRange(toCMCursor(from), toCMCursor(to));
    }
    public async getAbsolutePath(): Promise<string> {
        return `${this.fileName}`;
    }
    public async getLine(lineNr): Promise<string> {
        return this.editor.getLine(lineNr);
    }
}

export class ActiveSourceDocument extends SourceDocument implements IActiveSourceDocument {
    constructor(editor: CodeMirrorEditor, fileName: string) {
        super(editor, fileName);
    }
    public async getCursor(): Promise<Cursor> {
        const cmCursor = this.editor.getCursor();
        return {
            line: cmCursor.line,
            col: cmCursor.ch
        }
    }
}