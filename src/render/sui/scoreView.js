// ## renderOperation
// Do a thing to the music.
class SuiScoreView {
  addTextGroup(textGroup) {
    SmoUndoable.changeTextGroup(score, this.undoBuffer, textGroup,
      UndoBuffer.bufferSubtypes.ADD);
    this.renderer.renderScoreModifiers();
  }

  removeTextGroup(textGroup) {
    SmoUndoable.changeTextGroup(this.score, this.undoBuffer, textGroup,
      UndoBuffer.bufferSubtypes.REMOVE);
    this.renderer.renderScoreModifiers();
  }

  updateTextGroup(oldVersion, newVersion) {
    SmoUndoable.changeTextGroup(this.score, this.undoBuffer, oldVersion,
      UndoBuffer.bufferSubtypes.UPDATE);
    // TODO: only render the one TG.
    this.renderer.renderScoreModifiers();
  }
  constructor(renderer, score) {
    this.score = score;
    this.renderer = renderer;
    const scoreJson = score.serialize();
    const scroller = new suiScroller();
    this.tracker = new suiTracker(this.renderer, scroller);
    this.renderer.setMeasureMapper(this.tracker);
    this.pasteBuffer = new PasteBuffer();

    this.storeScore = SmoScore.deserialize(scoreJson);
    this.undoBuffer = new UndoBuffer();
    this.storeBuffer = new UndoBuffer();
  }

  changeScore(score) {
    this.renderer.score = score;
    this.renderer.setViewport(true);
    setTimeout(() => {
      $('body').trigger('forceResizeEvent');
    }, 1);
  }
}
