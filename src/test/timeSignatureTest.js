
class TimeSignatureTest {

  static CommonTests() {
    var application = SuiApplication.createUtApplication({scoreLoadJson:'sixTestJson'});
    var keys = application.controller;
    var score = keys.view.renderer.score;
    $('h1.testTitle').text('Time Signature Test');
    var layout = keys.view.renderer;
    var measure = SmoSelection.measureSelection(score, 0, 0).measure;

    var timeTest = () => {
      const promise = new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve();
            }, 200);
            });
        return promise;
    }
    var subTitle = (txt) => {
      $('.subTitle').text(txt);
    }
    var signalComplete = () => {
      subTitle('');
      return timeTest();
    }

    var drawDefaults = () => {
          // music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
		  layout.forceRender();
      return timeTest();
    }

  var stretchTest = () => {
    subTitle('stretch 6/8 test');
    var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
    SmoOperation.doubleDuration(selection);
    var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
    SmoOperation.dotDuration(selection);
    layout.forceRender();
    return timeTest();
  }

    var breakBeamTest = () => {
      subTitle('break beam');
      var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
      SmoOperation.toggleBeamGroup(selection);
		  layout.forceRender();
      return timeTest();
    }

    var breakBeamTest2 = () => {
      subTitle('break beam 2');
      var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
      SmoOperation.toggleBeamGroup(selection);
    	selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
    	SmoOperation.toggleBeamGroup(selection);
    	layout.forceRender();
      return timeTest();
    }

  	var unbreakBeamTest = () => {
      subTitle('unbreak beam');
      var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
      SmoOperation.toggleBeamGroup(selection);
  		layout.forceRender();
      return timeTest();
    }

    var contractTest = () => {
      subTitle('contract 6/8 test');
      var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
      SmoOperation.halveDuration(selection);
	    layout.forceRender();
      return timeTest();
    }

    var makeDupletTest = () => {
      subTitle('duplet 6/8 test');
      var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
      SmoOperation.dotDuration(selection);
      selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
      SmoOperation.doubleDuration(selection);
      selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
      SmoOperation.dotDuration(selection);
	    layout.forceRender();
      return timeTest();
    }

    var unmakeDupletTest = () => {
      subTitle('duplet 6/8 test');
      var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
      SmoOperation.undotDuration(selection);
      selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
      SmoOperation.undotDuration(selection);

      selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
      SmoOperation.doubleDuration(selection);
      selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
      SmoOperation.doubleDuration(selection);
	    layout.forceRender();
      return timeTest();
    }
    var changeBeamGroup = () => {
      subTitle('duplet 6/8 test');
      var group1=[];
      var group2=[];
      for (var i=0;i<4;++i) {
          group1.push(SmoSelection.noteSelection(score, 0, 0, 0, i));
      }
      group2.push(SmoSelection.noteSelection(score, 0, 0, 0, 4));
      group2.push(SmoSelection.noteSelection(score, 0, 0, 0, 5));
      SmoOperation.beamSelections(group1);
      SmoOperation.beamSelections(group2);
	    layout.forceRender();
      return timeTest();
    }
    var flipBeams1 = () => {
      subTitle('flip beams 1');
      var group2=[];
      group2.push(SmoSelection.noteSelection(score, 0, 0, 0, 4));
      group2.push(SmoSelection.noteSelection(score, 0, 0, 0, 5));
      SmoOperation.toggleBeamDirection(group2);
  		layout.forceRender();
      return timeTest();
    }

      return drawDefaults().then(breakBeamTest).then(breakBeamTest2).then(unbreakBeamTest)
	.then(stretchTest).then(contractTest).then(makeDupletTest).then(unmakeDupletTest)
      .then(changeBeamGroup).then(flipBeams1).then(signalComplete);

  }
}
