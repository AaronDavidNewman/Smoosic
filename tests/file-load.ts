import { SuiApplication } from '../src/application/application';
import { SmoToXml } from '../src/smo/mxml/smoToXml';
import { XmlToSmo } from '../src/smo/mxml/xmlToSmo';
import { SuiXhrLoader } from '../src/ui/fileio/xhrLoader';
import { MidiToSmo } from '../src/smo/midi/midiToSmo';

declare var $: any;

export function createLoadTests(): void {
  const jsonPath = 'https://aarondavidnewman.github.io/Smoosic/release/library/hymns/Precious Lord.json';
  const midiTiesPath = 'https://aarondavidnewman.github.io/Smoosic/release/library/miditest/ties.mid';
  const midiTripletPath = 'https://aarondavidnewman.github.io/Smoosic/release/library/miditest/triplet.mid';
  const midiKeyPath = 'https://aarondavidnewman.github.io/Smoosic/release/library/miditest/keytime.mid';
  var app = async (application: SuiApplication) => {
    const view = application.view!;
    await view.loadRemoteScore(jsonPath);
    await view.renderPromise();
    QUnit.test('loaded', assert => {
      assert.equal(view.score.staves[0].measures.length, 17);
      assert.equal($('#boo .vf-lyric').length, 82);
    });
    const xml = SmoToXml.convert(view.score);
    const newScore = XmlToSmo.convert(xml);
    await view.changeScore(newScore);
    QUnit.test('loadXml', assert => {
      assert.equal(view.score.staves[0].measures.length, 17);
      assert.equal($('#boo .vf-lyric').length, 82);
    });
    let midiData = new SuiXhrLoader(midiTiesPath);
    await midiData.loadAsync();
    let midiScore = (new MidiToSmo(parseMidi(midiData.value), 1024)).convert();
    await view.changeScore(midiScore);
    QUnit.test('loadMidi1', assert => {
      assert.equal(midiScore.staves[0].getTiesEndingAt({ staff: 0, measure: 1, voice: 0, tick: 0, pitches: [] }).length, 1);
    });
    midiData = new SuiXhrLoader(midiTripletPath);
    await midiData.loadAsync();
    midiScore = (new MidiToSmo(parseMidi(midiData.value), 1024)).convert();
    await view.changeScore(midiScore);
    QUnit.test('loadMidi2', assert => {
      assert.equal(midiScore.staves[0].measures[0].tuplets.length, 1);
    });
    midiData = new SuiXhrLoader(midiKeyPath);
    await midiData.loadAsync();
    midiScore = (new MidiToSmo(parseMidi(midiData.value), 1024)).convert();
    await view.changeScore(midiScore);
    QUnit.test('loadMidi2', assert => {
      assert.equal(midiScore.staves.length, 2);
      assert.equal(midiScore.staves[0].measures[0].keySignature, 'eb');
    });
    // console.log('measures ' + view.score.staves[0].measures.length);
  };

  SuiApplication.configure({
    mode: 'library',
    idleRedrawTime: 5,
    scoreDomContainer: 'outer-container'
  }).then((application) => {
    app(application)
  });
}