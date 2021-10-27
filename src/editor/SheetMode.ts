declare const require;
const CodeMirror = require("codemirror/lib/codemirror.js");
require("codemirror/addon/mode/simple.js");


CodeMirror.defineSimpleMode("sheet", {
    // The start state contains the rules that are intially used
    start: [
        { regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string" },
        { regex: /(?:\w+):/, token: "keyword", next: "wmCommandValues"},
        { regex: /.*--WM-HIDDEN-LINE\s*$/, token: "comment wm-hidden-line"},
        { regex: /using/, token: "keyword"},
        { regex: /\\[pf]{1,5}/,  token: "atom"},
        { regex: /--.*/, token: "comment" },
    ],
    wmCommandValues: [
        {regex: /;|\//, token: "text", next: "start"},
        {regex: /[^;\/]*/, token: "variable"},
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
