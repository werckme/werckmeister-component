export const MaxTickValue: number = 0x0FFFFFFF;
export const MaxChannel: number = 0xF;
export const MaxByteValue: number = 127;
export const MinByteValue: number = -128;

export const enum EventType {
    UndefinedEvent = 0,
    NoteOff = 0x8,
    NoteOn = 0x9,
    NoteAftertouch = 0xA,
    Controller = 0xB,
    ProgramChange = 0xC,
    ChannelAftertouch = 0xD,
    PitchBend = 0xE,
    MetaEvent = 0xFF
}

function checkedRange(x: number, min: number, max: number): number {
    if (x < min || x > max) {
        throw new Error(`${x} is not in range(${min}, ${max})`);
    }
    return x;
}

export class MidiEvent {
    private _channel: number;
    private _parameter1: number;
    private _parameter2: number;
    private _eventType: EventType;

    get channel(): number { return this._channel; }
    set channel(x: number) { this._channel = checkedRange(x, 0, MaxChannel); }

    get parameter1(): number { return this._parameter1; }
    set parameter1(x: number) { this._parameter1 = checkedRange(x, MinByteValue, MaxByteValue); }

    get parameter2(): number { return this._parameter2; }
    set parameter2(x: number) { this._parameter2 = checkedRange(x, MinByteValue, MaxByteValue); }

    get eventType(): EventType { return this._eventType; }
    set eventType(x: EventType) { this._eventType = x; }

    clone(): MidiEvent {
        let copy = new MidiEvent();
        copy.channel = this.channel;
        copy.parameter1 = this.parameter1;
        copy.parameter2 = this.parameter2;
        copy.eventType = this.eventType;
        return copy;
    }
}