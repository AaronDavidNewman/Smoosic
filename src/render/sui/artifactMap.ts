import { SvgHelpers } from './svgHelpers';
import { SvgBox } from '../../smo/data/common';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';
import { SuiScroller } from './scroller';
import { layoutDebug } from './layoutDebug';
export class SuiArtifactMap {
  children: SuiArtifactMap[] = [];
  noteMap: Record<string, SmoSelection> = {};
  selection?: SmoSelection;
  box: SvgBox = SvgBox.default;
  constructor(containers: number[], boxIndex: number, selection: SmoSelection | null) {
    if (!selection || !selection.note || !selection.note.logicalBox) {
      return;
    }
    this.box = SvgHelpers.smoBox(selection.measure.svg.logicalBox);
    if (boxIndex + 1 < containers.length) {
      this.children.push(new SuiArtifactMap(containers, boxIndex + 1, selection));
    } else {
      this.addBox(containers, boxIndex, selection);
    }
  }
  debugBox(svg: SVGSVGElement) {
    layoutDebug.debugBox(svg, this.box, layoutDebug.values.artifactMap);
    this.children.forEach((child) => {
      child.debugBox(svg);
    })
  }
  addBox(containers: number[], boxIndex: number, selection: SmoSelection) {
    if (!selection.note || !selection.note.logicalBox) {
      return;
    }
    if (boxIndex === containers.length - 1) {
      const innerBox = selection.note.logicalBox;
      this.box = SvgHelpers.unionRect(this.box, innerBox);
      this.noteMap[SmoSelector.getNoteKey(selection.selector)] = selection;
      return;
    } else {
      const innerBox = selection.measure.svg.logicalBox;
      if (!innerBox) {
        return;
      }
      this.box = SvgHelpers.unionRect(this.box, innerBox);
      if (this.children.length < containers[boxIndex] + 1) {
        this.children.push(new SuiArtifactMap(containers, boxIndex + 1, selection));
      } else {
        this.children[containers[boxIndex]].addBox(containers, boxIndex + 1, selection);
      }
    }
  }
  findArtifact(box: SvgBox): SmoSelection[] {
    let rv: SmoSelection[] = [];
    if (this.children.length === 0) {
      const objs: SmoSelection[] = Object.keys(this.noteMap).map((mm) => this.noteMap[mm]);
      return objs.filter((oo) => oo.box && SvgHelpers.doesBox1ContainBox2(oo.box, box))
    }
    const children = this.children.filter((child) => SvgHelpers.doesBox1ContainBox2(child.box, box));
    children.forEach((child) => {
      rv = rv.concat(child.findArtifact(box));
    });
    return rv;
  }
}
