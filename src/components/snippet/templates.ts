const singleSnippetTemplateText = `
tempo: $tempo;
device: MyDevice  midi 1;
$defLines
[
instrument: ex1;
{
$code
}
]`;



export const singleSnippetTemplate = (script: string, tempo:number, defLines: string = null) => {
    defLines = defLines || "instrumentDef:ex1  MyDevice  0 0 0;";
    let template = singleSnippetTemplateText
        .replace("$tempo", tempo.toString())
        .replace("$defLines", defLines);
    const charOffset = template.indexOf("$code");
    template = template.replace("$code", script);
    return  {
        script: template,
        charOffset: charOffset
    };
}
    


  