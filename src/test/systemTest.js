
class SystemTest {
   
    static CommonTests() {
		var score=SmoScore.getEmptyScore();
        score.addDefaultMeasure(0,{});
        score.addDefaultMeasure(1,{});
        score.addDefaultMeasure(2,{});
        score.addDefaultMeasure(3,{});
        score.addDefaultMeasure(4,{});
		score.addInstrument();
		
		var layout = smrfSimpleLayout.createScoreLayout(document.getElementById("boo"),score);
		layout.render();

		var tracker = new Tracker(layout);
		tracker.updateMap();
		var keys = new suiKeys({tracker:tracker,layout:layout});
    }
}
