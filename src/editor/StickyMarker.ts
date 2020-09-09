import { Marker } from './Marker';
import { IRange } from '../IEditor';
import * as _ from 'lodash';
import { MarkerOptions } from '../MarkerOptions';

export class StickyMarker extends Marker {
    beginAnchor: any;
    endAnchor: any;
    constructor(public range: IRange, options: MarkerOptions) {
        super(range, options);
    }

    addToEditor(aced: any) {
        this.createAnchors(aced);
        super.addToEditor(aced);
    }

    removeFromEditor() {
        this.range = new ace.Range(this.range.start.row, this.range.start.column, this.range.end.row, this.range.end.column)
        this.beginAnchor.detach();
        this.endAnchor.detach();
        super.removeFromEditor();
    }

    private createAnchors(aced: any) {
        this.beginAnchor = aced.getSession().getDocument().createAnchor(this.range.start.row, this.range.start.column);
        this.endAnchor = aced.getSession().getDocument().createAnchor(this.range.end.row, this.range.end.column);
        this.range.start = this.beginAnchor;
        this.range.end = this.endAnchor;

    }
}