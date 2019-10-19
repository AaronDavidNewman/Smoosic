
class StaffTest {
  static CommonTests() {
		$('h1.testTitle').text('Chord Test');
		var keys = utController.createUi(SmoScore.getDefaultScore(),'Staff Test');
		var score = keys.score;
		var layout = keys.layout;
        score.addDefaultMeasureWithNotes(0,{});
        score.addDefaultMeasureWithNotes(1,{});
        score.addDefaultMeasureWithNotes(2,{});
		var tt = new SmoScoreText({text:'Hello world',x:240,y:30});
		var mt=new SmoMeasureText({position:SmoMeasureText.positions.left,text:'Measure Text'});
		var delay=100;
		// var measure = SmoSelection.measureSelection(score, 0, 0).measure;
		
		var detach = () => {
			keys.detach();
			keys = null;
			score = null;
			layout = null;
		}
		var timeTest = () => {
			const promise = new Promise((resolve, reject) => {
					setTimeout(() => {
						resolve();
					},
						delay);
				});
			return promise;
		}
		var subTitle = (txt) => {
			$('.subTitle').text(txt);
		}
		var signalComplete = () => {
			detach();
			subTitle('');

			return timeTest();
		}

		var drawDefaults = () => {
			// music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
			// measure.applyModifiers();
			return layout.render().then(timeTest);
		}
		
		var scoreText1 = () => {
			
			score.addScoreText(tt);
			return layout.render().then(timeTest);
		}
		
		var scoreText2 = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.boxModel='spacing';
			tt.width=100;
			return layout.render().then(timeTest);			
		}
		
		var scoreText3 = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.boxModel='spacingAndGlyphs';
			tt.fontInfo.size=20;
			tt.width=100;
			return layout.render().then(timeTest);	
		}
		
		var scoreText4 = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.fontInfo.family='Arial';
			tt.scaleInPlace(1.5);
			return layout.render().then(timeTest);
		}
		
		var _scaleUp = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.scaleInPlace(1.2);
			return layout.render().then(timeTest);
		}
		
		var scaleUp = () => {
			var p = _scaleUp();
			return p.then(_scaleUp).then(timeTest); // .then(_scaleUp);
		}
		
		var _scaleDown = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.scaleInPlace(0.8);
			return layout.render().then(timeTest);
		}
		var scaleDown = () => {
			var p = _scaleDown();
			return p.then(_scaleDown).then(timeTest); // .then(_scaleUp);
		}
		
		var _moveText = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.x = tt.x + 30;
			tt.y = tt.y + 10;
			return layout.render().then(timeTest);
		}
		
		var moveText  = () => {
			var p = _moveText();
			return p.then(_moveText).then(timeTest); // .then(_scaleUp);
		}
		
		var measureText1 = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.x = 240;
			tt.y = 30;
			tt.scaleX=1.0;
			tt.scaleY=1.0;
			tt.translateX=0;
			tt.translateY=0;
			
			mt = new SmoMeasureText({position:SmoMeasureText.positions.left,text:'Measure Text'});
			var selection = SmoSelection.measureSelection(score, 0, 0);
			selection.measure.addMeasureText(mt);
			
			return layout.render().then(timeTest);					
		}
		
		var measureText2 = () => {
			delay=1000;
			
			mt.position = SmoMeasureText.positions.above;
			mt.fontInfo.size='7';
			var selection = SmoSelection.measureSelection(score, 0, 0);
			selection.measure.addMeasureText(mt);
			
			return layout.render().then(timeTest);					
		}
		
				
		var measureText3 = () => {
			
			mt.position = SmoMeasureText.positions.below;
			var selection = SmoSelection.measureSelection(score, 0, 0);
			selection.measure.addMeasureText(mt);
			
			return layout.render().then(timeTest);					
		}
      
		var measureText4 = () => {
			
			mt.position = SmoMeasureText.positions.right;
			var selection = SmoSelection.measureSelection(score, 0, 0);
			selection.measure.addMeasureText(mt);
			
			return layout.render().then(timeTest);					
		}
		
        return drawDefaults().then(scoreText1).then(scoreText2).then(scoreText3).then(scoreText3).then(scoreText4).
		   then(scaleUp).then(scaleDown).then(moveText).then(measureText1).
		   then(measureText2).then(measureText3).then(measureText4).then(signalComplete);
    }
}
