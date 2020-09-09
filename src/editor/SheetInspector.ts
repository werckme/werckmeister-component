import { IEditor, IRange } from './IEditor';
import { AInspector, Token } from './AInspector';
import { TextInspector } from './TextInspector';

export enum TokenType {
    LoadExpression = "document-config-load",
    MetaEvent = "metaevent",
    MetaEventEnd = "metaevent-end",
    MetaArgs = "metaargs",
    TrackEnd = "track-end",
    DocumentMetaevent = "document-metaevent"
}

export enum MetaValueTypes {
    Device = "device:"
}

export interface IMidiConfig {
    port: number;
}

export class MidiConfig implements IMidiConfig {
    metaArgs: string;
    get port(): number {
        if (!this.metaArgs) {
            return null;
        }
        let nstr = this.metaArgs.match(/(.+?)\s+(.+?)\s+(\d+)/)[3];
        return Number.parseInt(nstr);
    }

}

export class SheetInspector extends TextInspector {
    constructor(editor: IEditor) {
        super(editor);
    }


    /**
     * @returns the range of the first '@load' expression block
     */
    getLastLoadExpression(): Token {
        return this.getLastTokenOfType(TokenType.LoadExpression);
    }

    getLastDocumentMetaEvent(): Token {
        return this.getLastTokenOfTypes([TokenType.DocumentMetaevent, TokenType.MetaEventEnd]);
    }

    getLastTrack(): Token {
        return this.getLastTokenOfType(TokenType.TrackEnd);
    }
    
    getMidiConfigs(): IMidiConfig[] {
        let result = [];
        let midiConfig: MidiConfig;
        for (let x of this.getTokenIterator()) {
            let token: Token = x as Token;
            if (!!midiConfig && token.isType(TokenType.MetaArgs)) {
                midiConfig.metaArgs = token.value;
                continue;
            }
            if (!!midiConfig && token.isType(TokenType.MetaEventEnd)) {
                result.push(midiConfig);
                midiConfig = null;
                continue;
            }
            if (!token.isType(TokenType.MetaEvent)) {
                continue;
            }
            if (token.value === MetaValueTypes.Device) {
                midiConfig = new MidiConfig();
                continue;
            }
        }
        return result;
    }
}