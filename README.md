# werckmeister-component

https://jsfiddle.net/ek92ugdL/10/

```html
<werckmeister-workspace id="workspace"/>
<werckmeister-editor id="ed1">
    -- main sheet
    c d e f g
</werckmeister-editor>
<button onclick="startPlayback()">Play</button>
<script>
    const workspace = document.getElementsById('workspace');
    const ed1 = document.getElementsById(ed1);
    workspace.registerEditor(ed1);
    function startPlayback() {
        workspace.playSheet();
    }
</script>

```