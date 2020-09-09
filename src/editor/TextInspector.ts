import { IEditor } from './IEditor';
import { AInspector } from './AInspector';
import * as _ from 'lodash';

const _isNewline = (char) => { 
    // assuming text is unixstyle LF
    if (char === '\n') {
        return true;
    }
    return false;
}

export class TextInspector extends AInspector {
    constructor(editor: IEditor) {
        super(editor);
    }

    getRowAndColumns(positions: number[]): {row: number, col: number}[] {
        const text = this.editor.getText();
        let row = 0;
        let col = 0;
        if (positions.length === 0) {
            return [];
        }
        const results = positions.map(x => x >= text.length ? null : {pos: x, row:0, col: 0});

        for(let idx=0; idx < text.length; ++idx) {
            let char = text[idx];
            if (_isNewline(char)) {
                ++row;
                col = 0;
                continue;
            }
            ++col;
            _(results)
                .filter(x => x.pos!==null && x.pos ===idx)
                .each(x=> {
                    x.row = row;
                    x.col = col-1;
                })
            ;
        }
        return results;
    }
}