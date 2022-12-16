import { SuiButton, SuiButtonParams } from './button';
declare var $: any;

export class DisplaySettings extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
  }

  refresh() {
    this.view.refreshViewport();
  }
  zoomout() {
    const globalLayout = this.view.score.layoutManager!.getGlobalLayout();
    globalLayout.zoomScale *= 1.1;
    this.view.updateZoom(globalLayout.zoomScale);
  }
  zoomin() {
    const globalLayout = this.view.score.layoutManager!.getGlobalLayout();
    globalLayout.zoomScale = globalLayout.zoomScale / 1.1;
    this.view.updateZoom(globalLayout.zoomScale);
  }
  playButton2() {
    this.view.playFromSelection();
  }
  stopButton2() {
    this.view.stopPlayer();
  }
  bind() {
    this.eventSource.domClick(this.buttonElement, this, this.buttonData.id, null);
  }
}
