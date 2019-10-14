

class TestAll {
	static Run = function() {
		  console.log("DOM fully loaded and parsed");
            TimeSignatureTest.CommonTests().then(
			ChordTest.CommonTests).then(VoiceTest.CommonTests).then(TupletTest.CommonTests)
			.then(KeySignatureTest.CommonTests).then(ClefTest.CommonTests)
			.then(PasteTest.CommonTests).then(UndoTest.CommonTests).then(MeasureTest.CommonTests).then(TrackerTest.CommonTests);
	}
}