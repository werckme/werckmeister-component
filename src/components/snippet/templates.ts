const singleSnippetTemplateText = `
tempo: $tempo;
device: MyDevice  midi 1;
instrumentDef:ex1  MyDevice  0 0 0;
[
instrument: ex1;
{
$code
}
]`;



export const singleSnippetTemplate = (script: string, tempo:number) => {
    let template = singleSnippetTemplateText.replace("$tempo", tempo.toString());
    const charOffset = template.indexOf("$code");
    template = template.replace("$code", script);
    return  {
        script: template,
        charOffset: charOffset
    };
}
    


  