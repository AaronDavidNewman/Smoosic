import { SvgHelpers } from "./svgHelpers";
import { SvgPoint, SvgBox, Renderable } from '../../smo/data/common';
import { SmoGlobalLayout, SmoPageLayout } from '../../smo/data/scoreModifiers';
declare var $: any;
const VF = eval('Vex.Flow');

export class VexRendererContainer {
    _renderer: any;
    pageNumber: number;
    box: SvgBox;
    getContext(): any {
        return this._renderer.getContext();
    }
    constructor(renderer: any, pageNumber: number, box: SvgBox) {
        this._renderer = renderer;
        this.pageNumber = pageNumber;
        this.box = box;
    }
    offsetBbox(element: SVGSVGElement): SvgBox {
        const yoff = this.box.y;
        const xoff = this.box.x;
        const lbox = element.getBBox();
        return ({ x: lbox.x + xoff, y: lbox.y + yoff, width: lbox.width, height: lbox.height });
    }
    get svg(): SVGSVGElement {
        return this.getContext().svg as SVGSVGElement;
    }
}
export class SvgPageMap {
    _layout: SmoGlobalLayout;
    _container: SVGSVGElement;
    _pageLayouts: SmoPageLayout[];
    vfRenderers: VexRendererContainer[] = [];
    constructor(layout: SmoGlobalLayout, container: SVGSVGElement, pages: SmoPageLayout[]) {
        this._layout = layout;
        this._container = container;
        this._pageLayouts = pages;
    }
    get container() {
        return this._container;
    }
    get layout() {
        return this._layout;
    }
    get pageLayouts() {
        return this._pageLayouts;
    }
    get zoomScale() {
        return this.layout.zoomScale;
    }
    get renderScale() {
        return this.layout.svgScale;
    }
    get pageHeight() {
        return this.layout.pageHeight * this.zoomScale;
    }
    get pageWidth() {
        return this.layout.pageWidth * this.zoomScale;
    }
    createRenderers() {
        const totalHeight = this.pageHeight *  this.pageLayouts.length ;
        $(this.container).css('width', '' + Math.round(this.pageWidth) + 'px');
        $(this.container).css('height', '' + Math.round(totalHeight) + 'px');
        this.vfRenderers.forEach((renderer) => {
            const container = (renderer.svg as SVGSVGElement).parentElement;
            if (container) {
                container.remove();
            }
        });
        this.vfRenderers = [];
        this.pageLayouts.forEach(() => {
            this.addPage();
        });
    }
    addPage() {
        const ix = this.pageLayouts.length - 1;
        const container = document.createElement('div');
        container.setAttribute('id', 'smoosic-svg-div-' + ix.toString());
        this._container.append(container);
        const vexRenderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
        const svg = vexRenderer.getContext().svg as SVGSVGElement;
        SvgHelpers.svgViewport(svg, 0, 0, this.pageWidth, this.pageHeight, this.renderScale);
        const topY = this.pageHeight * ix;
        const box = SvgHelpers.boxPoints(0, topY, this.pageWidth, this.pageHeight + topY)
        this.vfRenderers.push(new VexRendererContainer(vexRenderer, ix, box));
    }
    removePage() {
        let i = 0;
        // Don't remove the only page
        if (this.vfRenderers.length < 2) {
            return;
        }

        // Remove last page div
        const elementId = 'smoosic-svg-div-' + (this.vfRenderers.length - 1).toString();
        const container = document.getElementById(elementId);
        if (container) {
            container.remove();
        }
        // pop last renderer off the stack.
        const renderers = [];
        const layouts = [];
        for (i = 0; i < this.vfRenderers.length - 1; ++i) {
            renderers.push(this.vfRenderers[i]);
            layouts.push(this.pageLayouts[i]);
        }
        this.vfRenderers = renderers;
        this._pageLayouts = layouts;

        // update page height
        const totalHeight = this.pageHeight *  this.pageLayouts.length ;
        $(this.container).css('width', '' + Math.round(this.pageWidth) + 'px');
        $(this.container).css('height', '' + Math.round(totalHeight) + 'px');
    }
    updateLayout(layout: SmoGlobalLayout, pageLayouts: SmoPageLayout[]) {
        this._layout = layout;
        this._pageLayouts = pageLayouts;
        this.createRenderers();
    }
    getRendererForPage(page: number) {
        if (this.vfRenderers.length > page) {
            return this.vfRenderers[page];
        }
        return this.vfRenderers[this.vfRenderers.length - 1];
    }
    getRendererFromPoint(point: SvgPoint): VexRendererContainer | null {
        const ix = Math.round(point.y / (this.layout.pageHeight * this.layout.svgScale));
        if (ix < this.vfRenderers.length) {
            return this.vfRenderers[ix];
        }
        return null;
    }
    getRenderer(box: SvgBox | SvgPoint): VexRendererContainer {
        const rv =  this.getRendererFromPoint({ x: box.x, y: box.y });
        if (rv) {
            return rv;
        }
        return this.vfRenderers[0];
    }
    getRendererFromModifier(modifier?: Renderable) {
        let rv = this.vfRenderers[0];
        if (modifier && modifier.logicalBox) {
            const context = this.getRenderer(modifier.logicalBox);
            if (context) {
                rv = context;
            }
        }
        return rv;
    }
}
