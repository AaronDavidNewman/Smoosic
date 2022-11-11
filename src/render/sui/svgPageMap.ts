import { SvgHelpers } from "./svgHelpers";
import { SvgPoint, SvgBox, Renderable } from '../../smo/data/common';
import { SmoNote } from '../../smo/data/note';
import { layoutDebug } from './layoutDebug';
import { SmoMeasure } from '../../smo/data/measure';
import { SmoGlobalLayout, SmoPageLayout } from '../../smo/data/scoreModifiers';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';
import { ModifierTab } from '../../smo/xform/selections';

declare var $: any;
const VF = eval('Vex.Flow');


/**
 * Hash keys for music or modifier artifacts for quicker searching
 */
export interface measureIndex  {
  staff: number
  measure: number
}
export interface noteIndex {
  tick: number,
  voice: number
}

export class MappedNotes {
  box: SvgBox = SvgBox.default;
  systemMap: Map<noteIndex, SmoSelection> = new Map();
  addArtifact(selection: SmoSelection) {
    if (!selection.note || !selection.note.logicalBox) {
      return;      
    }
    const bounds: SvgBox = selection.note.logicalBox;
    if (this.systemMap.size === 0) {
      this.box = JSON.parse(JSON.stringify(bounds));
    }
    const ix = { tick: selection.selector.tick, voice: selection.selector.voice };
    this.systemMap.set(ix, selection);
    this.box = SvgHelpers.unionRect(bounds, this.box);
  }
  findArtifact(box: SvgBox): SmoSelection[] {
    let rv: SmoSelection[] = [];
    for (const [key, value] of this.systemMap) {
      const note = value.note;
      if (note && note.logicalBox && SvgHelpers.doesBox1ContainBox2(note.logicalBox, box)) {
        rv.push(value);
      }
    }
    return rv;
  }
}
export class MappedMeasures {
  box: SvgBox = SvgBox.default;
  systemMap: Map<measureIndex, MappedNotes> = new Map();
  addArtifact(selection: SmoSelection) {
    if (!selection.note || !selection.note.logicalBox) {
      return;      
    }
    const measureBox = SvgHelpers.unionRect(selection.note.logicalBox, selection.measure.svg.logicalBox);
    if (this.systemMap.size === 0) {
      this.box = JSON.parse(JSON.stringify(measureBox));
    }
    const ix = { staff: selection.selector.staff, measure: selection.selector.measure }
    if (!this.systemMap.has(ix)) {
      const nnote = new MappedNotes();
      this.systemMap.set(ix, nnote);  
    }
    this.systemMap.get(ix)?.addArtifact(selection);
    this.box = SvgHelpers.unionRect(measureBox, this.box);
  }
  clearMeasure(measure: SmoMeasure) {
    const ix = { staff: measure.measureNumber.staffId, measure: measure.measureNumber.measureIndex };
    if (this.systemMap.has(ix)){
      this.systemMap.delete(ix);
    }
  }
  findArtifact(box: SvgBox): SmoSelection[] {
    let rv: SmoSelection[] = [];
    for (const [key, value] of this.systemMap) {
      if (SvgHelpers.doesBox1ContainBox2(value.box, box)) {
        rv = rv.concat(value.findArtifact(box));
      }
    }
    return rv;
  }
}

export class MappedSystems {
  box: SvgBox = SvgBox.default;
  systemMap: Map<number, MappedMeasures> = new Map();
  addArtifact(selection: SmoSelection) {
    if (!selection.note || !selection.note.logicalBox) {
      return;      
    }
    const measureBox = SvgHelpers.unionRect(selection.note.logicalBox, selection.measure.svg.logicalBox);
    const line = selection.measure.svg.lineIndex;
    if (this.systemMap.size === 0) {
      this.box = JSON.parse(JSON.stringify(measureBox));
    }
    if (!this.systemMap.has(line)) {
      const nmeasure = new MappedMeasures();
      this.systemMap.set(line, nmeasure);
    }
    this.systemMap.get(line)?.addArtifact(selection);
    this.box = SvgHelpers.unionRect(this.box, measureBox);
  }
  clearMeasure(selection: SmoSelection) {
    if (this.systemMap.has(selection.measure.svg.lineIndex)) {
      const mmap = this.systemMap.get(selection.measure.svg.lineIndex);
      if (mmap) {
        mmap.clearMeasure(selection.measure);
        this.systemMap.delete(selection.measure.svg.lineIndex);
      }
    }
  }
  findArtifact(box: SvgBox): SmoSelection[] {
    let rv: SmoSelection[] = [];
    for (const [key, value] of this.systemMap) {
      if (SvgHelpers.doesBox1ContainBox2(value.box, box)) {
        rv = rv.concat(value.findArtifact(box));
      }
    }
    return rv;
  }
}
export class MappedModifier {
  box: SvgBox = SvgBox.default;
  modifierTabs: ModifierTab[] = [];
}
export class VexRendererContainer {
  _renderer: any;
  pageNumber: number;
  box: SvgBox;
  systemMap: MappedSystems = new MappedSystems();
  modifierYKeys: number[] = [];
  modifierTabDivs: Record<number, ModifierTab[]> = {};
  static get defaultMap() {
    return {
      box: SvgBox.default,
      systemMap: new Map()
    };
  }
  static get modifierDivs() {
    return 8;
  }
  getContext(): any {
    return this._renderer.getContext();
  }
  get divSize(): number {
    return this.box.height / VexRendererContainer.modifierDivs;
  }
  constructor(renderer: any, pageNumber: number, box: SvgBox) {
    this._renderer = renderer;
    this.pageNumber = pageNumber;
    this.box = box;
    let divEnd = this.divSize;
    for (let i = 0; i < VexRendererContainer.modifierDivs; ++i) {
      this.modifierYKeys.push(divEnd);
      divEnd += this.divSize;
    }
  }
  divIndex(y: number): number {
    return Math.round((y - this.box.y) / this.divSize);
  }
  clearMap() {
    this.systemMap = new MappedSystems();
    this.modifierTabDivs = {};
  }
  clearMeasure(selection: SmoSelection) {
    this.systemMap.clearMeasure(selection);
    const div = this.divIndex(selection.measure.svg.logicalBox.y);
    if (div < this.modifierYKeys.length) {
      const mods: ModifierTab[] = [];
      this.modifierTabDivs[div].forEach((mt: ModifierTab) => {
        if (mt.selection) {
          if (!SmoSelector.sameMeasure(mt.selection.selector, selection.selector)) {
            mods.push(mt);
          }
        } else {
          mods.push(mt);
        }
      });
      this.modifierTabDivs[div] = mods;
    }
  }
  addModifierTab(modifier: ModifierTab) {
    const div = this.divIndex(modifier.box.y);
    if (div < this.modifierYKeys.length) {
      if (!this.modifierTabDivs[div]) {
        this.modifierTabDivs[div] = [];
      }
      this.modifierTabDivs[div].push(modifier);
    }
  }
  addArtifact(selection: SmoSelection) {
    if (!selection.note || !selection.note.logicalBox) {
      return;
    }      
    this.systemMap.addArtifact(selection);
  }
  findArtifact(box: SvgBox): SmoSelection[] {
    return this.systemMap.findArtifact(box);
  }
  findModifierTabs(box: SvgBox): ModifierTab[] {
    const rv:ModifierTab[] = [];
    const div = this.divIndex(box.y);
    if (div < this.modifierYKeys.length) {
      if (this.modifierTabDivs[div]) {
        this.modifierTabDivs[div].forEach((modTab) => {
          if (SvgHelpers.doesBox1ContainBox2(modTab.box, box)) {
            rv.push(modTab);
          }
        });
      }
    }
    return rv;
  }
  offsetBbox(element: SVGSVGElement): SvgBox {
    const yoff = this.box.y;
    const xoff = this.box.x;
    const lbox = element.getBBox();
    return ({ x: lbox.x + xoff, y: lbox.y + yoff, width: lbox.width, height: lbox.height });
  }
  offsetSvgBox(box: SvgBox) {
    return { x: box.x - this.box.x, y: box.y - this.box.y, width: box.width, height: box.height };
  }
  offsetSvgPoint(box: SvgPoint) {
    return { x: box.x - this.box.x, y: box.y - this.box.y };
  }
  get svg(): SVGSVGElement {
    return this.getContext().svg as SVGSVGElement;
  }
}
export class SvgPageMap {
    _layout: SmoGlobalLayout;
    _container: HTMLElement;
    _pageLayouts: SmoPageLayout[];
    vfRenderers: VexRendererContainer[] = [];
    containerOffset: SvgPoint = SvgPoint.default;
    constructor(layout: SmoGlobalLayout, container: HTMLElement, pages: SmoPageLayout[]) {
        this._layout = layout;
        this._container = container;
        this._pageLayouts = pages;
    }
    get container() {
        return this._container;
    }
    /**
     * Update the offset of the music container, in client coordinates.
     * @param scrollPoint 
     */
    updateContainerOffset(scrollPoint: SvgPoint) {
      const rect = SvgHelpers.smoBox(this.container.getBoundingClientRect());
      this.containerOffset = { x: rect.x + scrollPoint.x, y: rect.y + scrollPoint.y };
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
    get pageDivHeight() {
      return this.layout.pageHeight * this.zoomScale;
    }
    get pageDivWidth() {
      return this.layout.pageWidth * this.zoomScale;
    }
    get pageHeight() {
      return this.layout.pageHeight / this.layout.svgScale;
    }
    get pageWidth() {
      return this.layout.pageWidth / this.layout.svgScale;
    }
    get totalHeight() {
      return this.pageDivHeight * this.pageLayouts.length;
    }
    createRenderers() {
      $(this.container).css('width', '' + Math.round(this.pageDivWidth) + 'px');
      $(this.container).css('height', '' + Math.round(this.totalHeight) + 'px');
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
      const ix = this.vfRenderers.length;
      const container = document.createElement('div');
      container.setAttribute('id', 'smoosic-svg-div-' + ix.toString());
      this._container.append(container);
      const vexRenderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
      const svg = vexRenderer.getContext().svg as SVGSVGElement;
      SvgHelpers.svgViewport(svg, 0, 0, this.pageDivWidth, this.pageDivHeight, this.renderScale * this.zoomScale);
      const topY = this.pageHeight * ix;
      const box = SvgHelpers.boxPoints(0, topY, this.pageWidth, this.pageHeight);
      this.vfRenderers.push(new VexRendererContainer(vexRenderer, ix, box));
    }
    clientToSvg(box: SvgBox) {
      const cof = (this.zoomScale * this.renderScale);
      const x = (box.x - this.containerOffset.x) / cof;
      const y = (box.y - this.containerOffset.y) / cof;
      const logicalBox = SvgHelpers.boxPoints(x, y, Math.max(box.width / cof, 1), Math.max(box.height / cof, 1));
      if (layoutDebug.mask | layoutDebug.values['mouseDebug']) {
        layoutDebug.updateMouseDebug(box, logicalBox, this.containerOffset);
      }
      return logicalBox;
    }
    svgToClient(box: SvgBox) {
      const cof = (this.zoomScale / this.renderScale);
      const x = (box.x * cof) + this.containerOffset.x;
      const y = (box.y * cof) + this.containerOffset.y;
      const clientBox = SvgHelpers.boxPoints(x, y, box.width * cof, box.height * cof);
      return clientBox;
    }
    findArtifact(box: SvgBox): { selections: SmoSelection[], page: VexRendererContainer} {
      const selections: SmoSelection[] = [];
      if (box.x < this.containerOffset.x || box.y < this.containerOffset.y) {
        return { selections, page: this.vfRenderers[0] };
      }
      const logicalBox = this.clientToSvg(box);
      const page = this.getRenderer(logicalBox);
      if (page) {
        return { selections: page.findArtifact(logicalBox), page };
      }
      return { selections, page: this.vfRenderers[0] };
    }
    findModifierTabs(box: SvgBox): ModifierTab[] {
      if (box.x < this.containerOffset.x || box.y < this.containerOffset.y) {
        return [];
      }
      const logicalBox = this.clientToSvg(box);
      const page = this.getRenderer(logicalBox);
      if (page) {
        return page.findModifierTabs(logicalBox);
      }
      return [];
    }
    addArtifact(selection: SmoSelection) {
      if (!selection.note || !selection.note.logicalBox) {
        return;
      }
      const page = this.getRenderer(selection.note.logicalBox);
      if (page) {
        page.addArtifact(selection);
      }
    }
    addModifierTab(modifier: ModifierTab) {
      const page = this.getRenderer(modifier.box);
      if (page) {
        page.addModifierTab(modifier);
      }
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
        const totalHeight = this.pageDivHeight *  this.pageLayouts.length ;
        $(this.container).css('width', '' + Math.round(this.pageDivWidth) + 'px');
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
        const ix = Math.floor(point.y / (this.layout.pageHeight / this.layout.svgScale));
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
