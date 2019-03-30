
class SystemTest {
   
    static CommonTests() {
		$('h1.testTitle').text('System Test');			
		var score=SmoScore.getEmptyScore();
        score.addDefaultMeasure(0,{});
        score.addDefaultMeasure(1,{});
        score.addDefaultMeasure(2,{});
        score.addDefaultMeasure(3,{});
        score.addDefaultMeasure(4,{});
		score.addInstrument();
		
		var keys = suiKeys.createUi(document.getElementById("boo"),score);
		keys.layout.render();		
		keys.tracker.updateMap();		
    }
}
