// This is a WIP to handle parts, instruments, etc.
// A score is a set of staves with notes.  A composition can tie scores together
// for purposes of part extraction, playback data, layout etc.
// ## Places to deserialize scores:
// .  controller/scoreFromQueryString
// .  fileDialog.js/SuiLoadFileDialog.commit
// . menus.js/SuiFileMenu.selection
// there is a reference to deserialize in undo.js but that is probably OK to stay.
class SmoComposition {

    constructor(parameters) {
        this.masterScore = {};
        this.staveScoreMap = {};
        this.displayScore = null;
        this.layoutNotifier = parameters.layoutNotifier;
        this.title = 'Beautiful Smoosic';
    }
    setMasterAsDisplayScore() {
        this.displayScore = this.masterScore;
    }
    setPartScore(staveId) {
        var staff = this.masterScore.staves[staffId];
        if (!staff) {
            this.setMasterAsDisplayScore();
        }
        if (!staveScoreMap[staff]) {

        }
    }

    static serialize() {

    }

}
