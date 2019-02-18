

class VoiceTest {


    // Create an SVG renderer and attach it to the DIV element named "boo".
    static createContext() {
        var div = document.getElementById("boo");
        $(div).html('');

        var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

        // Configure the rendering context.
        renderer.resize(450, 200);
        var context = renderer.getContext();
        context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");
        return context;
    }

    static CommonTests() {
        var context = VoiceTest.createContext();
		var smoMeasure = new SmoMeasure();
		var voice2=SmoMeasure.defaultVoice44;
		smoMeasure.voices.push({notes:voice2});
        var measure = new VxMeasure(context,{smoMeasure:smoMeasure});

        var timeTest = () => {
            const promise = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve();
                    },
                        500);
                });
            return promise;
        }

        var drawDefaults = () => {
            // music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
            // measure.applyModifiers();
            measure.render();
            return timeTest();
        }
		var accidentalTest = () => {
            var selection = new Selection([
			{tickIndex:1,pitches:[0]}
					]);
			var actor = new SmoTransposePitchActor(
			{
                selections: selection,
                offset: -1
            });
            measure.applyTransform(actor);
            measure.render();
            return timeTest();
        }
		
		var serializeTest = () => {
			measure.unrender();
			measure.smoMeasure=SmoMeasure.deserialize(JSON.stringify(serializeTestJson.tupletMeasure));;
			measure.render();
		}
		var serialize = () => {
			console.log(JSON.stringify(measure.smoMeasure,null,' '));
			return timeTest();
		}
		
        drawDefaults().then(accidentalTest).then(serializeTest);
    }
}
