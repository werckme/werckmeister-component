# werckmeister-component

A [web component](https://en.wikipedia.org/wiki/Web_Components) which allows you to embed werckmeister snippets on your website.

## How to use

* include the javascript file

```html
<script src="https://unpkg.com/werckmeister-components@~1.0.0/werckmeister-components.js"></script>
```
* embed your snippet

```html
<werckmeister-snippet>
<![CDATA[
device: MyDevice  midi _usePort=0;
instrumentDef:lead    _onDevice=MyDevice  _ch=0 _pc=0;

-- a melody track
[
instrument: lead;
{
    c d e f | g a b c
}
]
]]>
</werckmeister-snippet> 
```

## Demo
https://jsfiddle.net/z8qv5b7j/


## Options

### `wm-type`
can be either `default` or `single`. `single` means that the input is treated as one singe voice line such as `c d e f g`.
In `default`mode the input has to be a valid `werckmeister` source.

https://jsfiddle.net/bh4ugc5q/

### `wm-tempo`
Set the tempo of an snippet.
### `wm-style`
Inline css rules to set up the apperance of the snippet.
https://jsfiddle.net/zxhgyv2p/

### `wm-css-url`
Set an url of an css file, to override the default css of the snippet.
https://jsfiddle.net/m01bzg3f/

### `wm-soundfont-url`
Set the repo url. See [Soundfont Server](https://github.com/werckme/soundfont-server).
