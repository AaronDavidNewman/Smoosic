
class TextTest {
  static CommonTests() {
		var keys = utController.createUi(SmoScore.getDefaultScore(),'Text Test');
		var score = keys.score;
		var layout = keys.layout;
        score.addDefaultMeasureWithNotes(0,{});
        score.addDefaultMeasureWithNotes(1,{});
        score.addDefaultMeasureWithNotes(2,{});
		var undo = keys.undoBuffer;
		var tt = new SmoScoreText({text:'Hello world',x:240,y:30});
		var mt=new SmoMeasureText({position:SmoMeasureText.positions.left,text:'Measure Text'});
		var delay=250;
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
			SmoUndoable.scoreOp(score,'addScoreText',tt,undo,'Score Text Test 1');
			score.addScoreText(tt);
			return layout.render().then(timeTest);
		}
		
		var scoreText2 = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.boxModel=SmoScoreText.boxModels.spacing;
			tt.width=100;
			return layout.render().then(timeTest);			
		}
		
		var scoreText3 = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.boxModel=SmoScoreText.boxModels.spacingAndGlyphs;
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
                
        
        var rehearsalMarkTest= () => {
            var rh=new SmoRehearsalMark();
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoUndoable.scoreSelectionOp(score,selection,'addRehearsalMark',rh,undo,'test rehearsal mark');
			return layout.render().then(timeTest);					            
        }            
        
         var rehearsalMarkTest2= () => {
            var rh=new SmoRehearsalMark();
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoUndoable.scoreSelectionOp(score,selection,'addRehearsalMark',rh,undo,'test rehearsal mark2.1');
            selection = SmoSelection.measureSelection(score, 0, 2);
            rh=new SmoRehearsalMark();
			SmoUndoable.scoreSelectionOp(score,selection,'addRehearsalMark',rh,undo,'test rehearsal mark2.2');
			return layout.render().then(timeTest);					            
        }
        
         var rehearsalMarkTest3= () => {
            var rh=new SmoRehearsalMark();
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoUndoable.scoreSelectionOp(score,selection,'removeRehearsalMark',null,undo,'test rehearsal mark2');
			return layout.render().then(timeTest);					            
        }
        
        var tempoTest = () => {
            var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoUndoable.scoreSelectionOp(score,selection,'removeRehearsalMark',null,undo,'tempo test 1.1');
            selection = SmoSelection.measureSelection(score, 0, 2);
            SmoUndoable.scoreSelectionOp(score,selection,'removeRehearsalMark',null,undo,'tempo test 1.2');
            
            selection = SmoSelection.measureSelection(score, 0, 0);
            SmoUndoable.scoreSelectionOp(score,selection,'addTempo',
              new SmoTempoText({bpm:144}),undo,'tempo test 1.3');
            selection = SmoSelection.measureSelection(score, 0, 1);
            SmoUndoable.scoreSelectionOp(score,selection,'addTempo',
              new SmoTempoText({tempoMode: SmoTempoText.tempoModes.textMode,
                  tempoText:SmoTempoText.tempoTexts.adagio,bpm:120}),undo,'tempo test 1.3');
			return layout.render().then(timeTest);					            

        }
		
		var lyricTest = () => {
			var s1 = SmoSelection.noteSelection(score,0,0,0,1);
			var s2 = SmoSelection.noteSelection(score,0,0,0,2);
			var s3 = SmoSelection.noteSelection(score,0,0,0,3);
			var s4 = SmoSelection.noteSelection(score,0,1,0,0);
			var lyric = new SmoLyric({text:'All'});
			SmoUndoable.scoreSelectionOp(score,s1,'addLyric',new SmoLyric({text:'All'}),undo,'lyric test 1');
			SmoUndoable.scoreSelectionOp(score,s2,'addLyric',new SmoLyric({text:'Boys'}),undo,'lyric test 2');
			SmoUndoable.scoreSelectionOp(score,s3,'addLyric',new SmoLyric({text:'Eat'}),undo,'lyric test 3');
			SmoUndoable.scoreSelectionOp(score,s4,'addLyric',new SmoLyric({text:'Grass'}),undo,'lyric test 4');
			SmoUndoable.scoreSelectionOp(score,s1,'addLyric',new SmoLyric({verse:1,text:'Cows'}),undo,'lyric test 1');
			SmoUndoable.scoreSelectionOp(score,s2,'addLyric',new SmoLyric({verse:1,text:'Do'}),undo,'lyric test 2');
			SmoUndoable.scoreSelectionOp(score,s3,'addLyric',new SmoLyric({verse:1,text:'Fine'}),undo,'lyric test 3');
			SmoUndoable.scoreSelectionOp(score,s4,'addLyric',new SmoLyric({verse:1,text:'Always'}),undo,'lyric test 4');
			return layout.render().then(timeTest);					            
		}
        
         /* var rehearsalMarkTest4= () => {
            var rh=new SmoRehearsalMark();
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoUndoable.scoreSelectionOp(score,selection,'addRehearsalMark',rh,undo,'test rehearsal mark2');
			return layout.render().then(timeTest);					            
        }    */  
		
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
			SmoUndoable.scoreSelectionOp(score,selection,'addMeasureText',mt,undo,'test measureText1');
			
			return layout.render().then(timeTest);					
		}
		
		var measureText2 = () => {
			
			mt.position = SmoMeasureText.positions.above;
			mt.fontInfo.size='7';
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoUndoable.scoreSelectionOp(score,selection,'addMeasureText',mt,undo,'test measureText2');
			
			return layout.render().then(timeTest);					
		}
		
				
		var measureText3 = () => {
			
			mt.position = SmoMeasureText.positions.below;
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoUndoable.scoreSelectionOp(score,selection,'addMeasureText',mt,undo,'test measureText3');
			
			return layout.render().then(timeTest);					
		}
      
		var measureText4 = () => {

			mt.position = SmoMeasureText.positions.right;
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoUndoable.scoreSelectionOp(score,selection,'addMeasureText',mt,undo,'test measureText4');
			
			return layout.render().then(timeTest);
		}
		
		var titleText1 = () => {
			SmoUndoable.scoreOp(score,'removeScoreText',tt,undo,'remove text titelText1');
			tt = new SmoScoreText({text:'My Song',position:'title'});
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoUndoable.scoreSelectionOp(score,selection,'removeMeasureText',mt,undo,'test measureText3');
			SmoUndoable.scoreOp(score,'addScoreText',tt,undo,'Score Title Test 1');
			return layout.render().then(timeTest);
		}
		
		var titleText2 = () => {
			delay=500;
			tt = new SmoScoreText({text:'My Foot',position:'footer'});
			SmoUndoable.scoreOp(score,'addScoreText',tt,undo,'Score Title Test 2');
			return layout.render().then(timeTest);
		}
		
		var titleText3 = () => {
			// score.removeScoreText(tt);
			tt = new SmoScoreText({text:'My Head',position:'header'});
			// var selection = SmoSelection.measureSelection(score, 0, 0);
			// selection.measure.removeMeasureText(mt.attrs.id);
			SmoUndoable.scoreOp(score,'addScoreText',tt,undo,'Score Title Test 3');
			return layout.render().then(timeTest);
		}
		
		var copyText1 = () => {
			tt = new SmoScoreText({text:'Copyright By Me A Long Line Right Justified',position:SmoScoreText.positions.copyright,
			    boxModel: SmoScoreText.boxModels.wrap,width:100,height:100});
			SmoUndoable.scoreOp(score,'addScoreText',tt,undo,'Copy Text Test 1');
			return layout.render().then(timeTest);
		}
		
		var copyText2 = () => {
			SmoUndoable.scoreOp(score,'removeScoreText',tt,undo,'Copy Text Test 1');
			tt = new SmoScoreText({text:'Copyright By Me A Long Line Center Justified',position:SmoScoreText.positions.copyright,
			    boxModel: SmoScoreText.boxModels.wrap,width:100,height:100,justification:'center'});
			SmoUndoable.scoreOp(score,'addScoreText',tt,undo,'Copy Text Test 1');
			return layout.render().then(timeTest);
		}			
		
        return drawDefaults().then(scoreText1).then(scoreText2).then(scoreText3).then(scoreText3).then(scoreText4).
		   then(scaleUp).then(scaleDown).then(moveText).then(lyricTest).then(rehearsalMarkTest).then(rehearsalMarkTest2)
           .then(rehearsalMarkTest3).then(tempoTest).then(measureText1).
		   then(measureText2).then(measureText3).then(measureText4)
		   .then(titleText1).then(titleText2).then(titleText3).then(copyText1).then(copyText2).then(signalComplete);
    }
}
