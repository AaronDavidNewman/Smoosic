
class SystemTest {
   
    static CommonTests() {
		var score=SmoScore.getEmptyScore();
        score.addDefaultMeasure(0,{});
        score.addDefaultMeasure(1,{});
        score.addDefaultMeasure(2,{});
		score.addInstrument();
		
		var layout = smrfSimpleLayout.createScoreLayout(document.getElementById("boo"),score);
		layout.render();

    }
}
