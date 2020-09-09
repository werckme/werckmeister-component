import { IEditor, IToken } from './IEditor';
import { TokenType } from './SheetInspector';
import * as _ from 'lodash';

export class Token implements IToken {
    get value(): string {
        return this.token.value;
    }
    get types(): string[] {
        return this.token.types;
    }
    isType(val: string): boolean {
        return this.token.isType(val);
    }
    constructor(private token: IToken, public row: number) {

    }


}

export class AInspector {
    constructor(public editor: IEditor) {

    }

    get rows(): number {
        return this.editor.getNumRows();
    }

    getTokensAt(row: number): Token[] {
        let tokens: IToken[] = this.editor.getTokensAtRow(row);
        return tokens.map(x=> new Token(x, row));
    }

    *getTokenIterator(): IterableIterator<Token> {
        let numRows = this.editor.getNumRows();
        for (var idxRow=0; idxRow < numRows; ++idxRow) {
            let tokens = this.getTokensAt(idxRow);
            for(let token of tokens) {
                yield token;
            }
        }
    }


    getLastTokenOfType(type: TokenType): Token {
        let lastToken = null;
        let token: Token;
        for (token of this.getTokenIterator()) {
            if (token.isType(type)) {
                lastToken = token;
            }
        }
        return lastToken;
    }   

    getLastTokenOfTypes(types: TokenType[]): Token {
        let lastToken = null;
        let token: Token;
        for (token of this.getTokenIterator()) {
            let match = _(types).every(x => token.isType(x));
            if (match) {
                lastToken = token;
            }
        }
        return lastToken;
    }   
}