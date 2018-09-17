
var timeTest = () => {
    const promise = new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            },
                500);
        });
    return promise;
};

class Test1 {

    // Create an SVG renderer and attach it to the DIV element named "boo".
    static createContext() {
        var div = document.getElementById("boo");
        $(div).html('');

        var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

        // Configure the rendering context.
        renderer.resize(500, 500);
        var context = renderer.getContext();
        context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");
        return context;
    }

    static CommonTests() {
        var context = Test1.createContext();
        var measure = new VxMeasure(context);
        measure.applyModifiers();
        measure.render();

        var timeTest = () => {
            const promise = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve();
                    },
                        500);
                });
            return promise;
        }
        var selection = new Selection({
                ticks: {
                    '0': [0]
                }
            });
        measure.applyTransform('vxTransposePitchActor', {
            selections: selection,
            offset: -1
        });
        measure.render();

    }

}
