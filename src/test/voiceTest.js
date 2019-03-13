

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
		
		var system = new SmoSystemStaff({measures:[smoMeasure]});
		var line = new VxSystemStaff(context,{smoMeasures:system});
		var measure = line.smoMeasures.measures[0];

        var timeTest = () => {
            const promise = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve();
                    },
                        500);
                });
            return promise;
        }
		
		var signalComplete = () => {
			return timeTest();
		}

        var drawDefaults = () => {
            // music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
            // measure.applyModifiers();
            line.render();
            return timeTest();
        }
		var accidentalTest = () => {
			var target = measure.getSelection(
			0,1,[0]);
			if (target) {
				target.note.transpose([0],-1);
			}
			smoModifierFactory.applyModifiers(measure);
            line.render();
            return timeTest();
        }
		
		var serializeTest = () => {
			line.unrender();
			smoMeasure = SmoMeasure.deserialize(JSON.stringify(serializeTestJson.tupletMeasure));
			system = new SmoSystemStaff({measures:[smoMeasure]});
			line = new VxSystemStaff(context,{smoMeasures:system});
			line.render();
		}
		var serialize = () => {
			console.log(JSON.stringify(measure,null,' '));
			return timeTest();
		}
		
        return drawDefaults().then(accidentalTest).then(serializeTest).then(signalComplete);
    }
}
