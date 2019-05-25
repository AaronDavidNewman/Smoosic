
class EditorTest {
   
    static CommonTests() {
		var score=SmoScore.getEmptyScore();
        score.addDefaultMeasureWithNotes(0,{});
        score.addDefaultMeasureWithNotes(1,{});
        score.addDefaultMeasureWithNotes(2,{});
        score.addDefaultMeasureWithNotes(3,{});
        score.addDefaultMeasureWithNotes(4,{});
		score.addInstrument();
		
		var keys = suiController.createUi(document.getElementById("boo"),score);
		keys.layout.render();		
		keys.tracker.updateMap();		
    }
}
