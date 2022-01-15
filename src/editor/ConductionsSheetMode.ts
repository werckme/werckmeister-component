declare const require;
const CodeMirror = require("codemirror/lib/codemirror.js");
require("codemirror/addon/mode/simple.js");

const selectors = [
    "fromPosition",
    "toPosition",
    "onBeat",
    "fromPitch",
    "toPitch",
    "pitch",
    "instrument",
    "fromBeat",
    "toBeat",
    "fromBar",
    "toBar",
    "onBar",
    "nthBar",
    "channel",
    "all",
    "withTag"
];

const declarations = [
    "velocity",
    "timeOffset",
    "duration",
    "pitch"
];

CodeMirror.defineSimpleMode("conductions", {
    // The start state contains the rules that are intially used
    start: [
        { regex: new RegExp(`${selectors.join('|')}`), token: "tag"},
        { regex: new RegExp(`${declarations.join('|')}`), token: "property"},
        { regex: /[0-9]\s*%{0,1}/, token: "number"},
        { regex: /--.*/, token: "comment" },
        { regex: /.*--WM-HIDDEN-LINE\s*$/, token: "comment wm-hidden-line"},
    ],
    // The meta property contains global information about the mode. It
    // can contain properties like lineComment, which are supported by
    // all modes, and also directives like dontIndentStates, which are
    // specific to simple modes.
    meta: {
        dontIndentStates: ["comment"],
        lineComment: "--"
    }
});
