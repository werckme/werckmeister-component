import { IMarker, IRange} from "./IEditor";
import { MarkerOptions } from './MarkerOptions';
import * as $ from 'jquery';
const ClassMarked = "marked";
const ClassOff = "off"; // do not show, without transition

export function createMarkerId(row: number, column: number): string {
    return `${row}-${column}`;
}

export function allMarkersOff() {
    $("[werckzeug]").attr("werckzeug", ClassOff);
}

export class Marker implements IMarker {
    aceId: any;
    aced: any;
    id: string;
    selector: string;
    marked: boolean = false;
    constructor(public range: IRange, public options: MarkerOptions) {
        this.options = this.options || new MarkerOptions();
        this.options.elementClasses.push(ClassMarked);
        this.id = createMarkerId(range.start.row, range.start.column);
        this.selector = `acedmarker-${this.id}`;
    }

    get markerClass(): string {
        return this.selector + " " + this.options.elementClasses.join(" ");
    }

    addToEditor(aced: any) {
        this.aceId = aced.session.addMarker(this.range, this.markerClass, null, true);
        this.aced = aced;
        this.setMarked(this.marked);
    }

    removeFromEditor() {
        this.aced.getSession().removeMarker(this.aceId);
    }

    getElement() {
        return $(`.${this.selector}`);
    }

    private hasMarkedClass_():boolean {
        let el = this.getElement();
        return el.attr("werckzeug") === ClassMarked;
    }

    private updateMarkedClass() {
        let el = this.getElement();
        if (el.length === 0) {
            return;
        }
        
        if (this.marked) {
            el.attr("werckzeug", ClassMarked);
        } else {
            el.attr("werckzeug", "");
        }
    }

    setMarked(val: boolean) {
        if (val===this.hasMarkedClass_()) {
            return;
        }
        this.marked = val;
        this.updateMarkedClass();
    }

}