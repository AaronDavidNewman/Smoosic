// ## Description:
//   Create a system of staves and draw music on it.
//
// ##  Options:
//  clef:'treble',
//  num_beats:num_beats,
//  timeSignature: '4/4',
//  smoMeasures: []
class VxSystem {
	constructor(context, topY, lineIndex,score) {
		this.context = context;
		this.leftConnector = [null, null];
		this.lineIndex = lineIndex;
        this.score = score;
		this.maxStaffIndex = -1;
		this.maxSystemIndex = -1;
		this.width = -1;
		this.smoMeasures = [];
		this.vxMeasures = [];
		this.endcaps = [];
		this.endings = [];
		this.box = {
			x: -1,
			y: -1,
			width: 0,
			height: 0
		};
		this.currentY = 0;
		this.topY = topY;
		this.clefWidth = 70;
		this.ys = [];
		this.measures = [];
		this.modifiers = [];
	}

	getVxMeasure(smoMeasure) {
		for (var i = 0; i < this.vxMeasures.length; ++i) {
			var vm = this.vxMeasures[i];
			if (vm.smoMeasure.attrs.id === smoMeasure.attrs.id) {
				return vm;
			}
		}

		return null;
	}

	getVxNote(smoNote) {
		var note;
		if (!smoNote) {
			return null;
		}
		for (var i = 0; i < this.measures.length; ++i) {
			var mm = this.measures[i];
			if (mm.noteToVexMap[smoNote.id]) {
				return mm.noteToVexMap[smoNote.id];
			}
		}
		return null;
	}

	updateLyricOffsets() {
        for (var i = 0;i < this.score.staves.length;++i) {
            var lowestYs = {};
    		var lyrics=[];
            var vxMeasures = this.vxMeasures.filter((vx) => {
                return vx.smoMeasure.measureNumber.staffId == i;
            });
            vxMeasures.forEach((mm) => {
                var smoMeasure = mm.smoMeasure;
                smoMeasure.voices.forEach((voice) => {
                    voice.notes.forEach((note) => {
                        note.getModifiers('SmoLyric').forEach((lyric) => {
                            var lowest = (lyric.logicalBox.y+lyric.logicalBox.height);
                            if (!lowestYs[lyric.verse]) {
                                lowestYs[lyric.verse] = lowest;
                            } else {
                                lowestYs[lyric.verse] = lowestYs[lyric.verse] < lowest ? lowest : lowestYs[lyric.verse];
                            }
                            lyrics.push(lyric);
                        });
                    });
                });
            });
            lyrics.forEach((lyric) => {
    			lyric.adjY = lowestYs[lyric.verse] - (lyric.logicalBox.y + lyric.logicalBox.height);
    			var dom = $(this.context.svg).find(lyric.selector)[0];
    			dom.setAttributeNS('','transform','translate('+lyric.adjX+' '+lyric.adjY+')');
    		});
        }
	}

	renderModifier(modifier, vxStart, vxEnd) {
		// if it is split between lines, render one artifact for each line, with a common class for
		// both if it is removed.
		if (vxStart) {
		    $(this.context.svg).find('g.' +  modifier.attrs.id).remove();
        }
        var artifactId = modifier.attrs.id + '-' + this.lineIndex;
		var group = this.context.openGroup();
		group.classList.add(modifier.id);
		group.classList.add(artifactId);
		if ((modifier.type == 'SmoStaffHairpin' && modifier.hairpinType == SmoStaffHairpin.types.CRESCENDO) ||
			(modifier.type == 'SmoStaffHairpin' && modifier.hairpinType == SmoStaffHairpin.types.DECRESCENDO)) {
			var hairpin = new VF.StaveHairpin({
					first_note: vxStart,
					last_note: vxEnd
				}, modifier.hairpinType);
			hairpin.setRenderOptions({
				height: modifier.height,
				y_shift: modifier.yOffset,
				left_shift_px: modifier.xOffsetLeft,
				right_shift_px: modifier.xOffsetRight
			});
			hairpin.setContext(this.context).setPosition(modifier.position).draw();
		} else if (modifier.type == 'SmoSlur') {
			var curve = new VF.Curve(
					vxStart, vxEnd, //first_indices:[0],last_indices:[0]});
				{
					thickness: modifier.thickness,
					x_shift: modifier.xOffset,
					y_shift: modifier.yOffset,
                    spacing:modifier.spacing,
					cps: modifier.controlPoints,
					invert: modifier.invert,
					position: modifier.position
				});
			curve.setContext(this.context).draw();
            /*
            var curve = new VF.StaveTie({
                first_note:vxStart,
                last_note:vxEnd,
                first_indices:[0],
                last_indices:[0],
                tie_spacing:-10
            });
curve.setContext(this.context).draw();
*/
		}

		this.context.closeGroup();
		return svgHelpers.smoBox(group.getBoundingClientRect());
	}

	renderEndings() {
		this.smoMeasures.forEach((smoMeasure) => {
			var staffId = smoMeasure.measureNumber.staffId;
			var endings = smoMeasure.getNthEndings();
			endings.forEach((ending) => {
				$(this.context.svg).find('g.' + ending.attrs.id).remove();
				var group = this.context.openGroup(null,ending.attrs.id);
				var voAr=[];
				group.classList.add(ending.attrs.id);
				group.classList.add(ending.endingId);

				for (var i = ending.startBar; i <= ending.endBar; ++i) {
					var endMeasure = this.getMeasureByIndex(i,staffId);
					if (!endMeasure) {
						continue;
					}
					voAr.push(endMeasure);
					var vxMeasure = this.getVxMeasure(endMeasure);
					var vtype = ending.toVexVolta(endMeasure.measureNumber.measureNumber);
					var vxVolta = new VF.Volta(vtype, ending.number,ending.xOffsetStart, ending.yOffset);
					vxMeasure.stave.modifiers.push(vxVolta);
					vxVolta.setContext(this.context).draw(vxMeasure.stave, endMeasure.staffX);
				}
				this.context.closeGroup();
				ending.renderedBox = svgHelpers.smoBox(group.getBoundingClientRect());
				ending.logicalBox = svgHelpers.clientToLogical(this.context.svg, ending.renderedBox);

				// Adjust real height of measure to match volta height
				voAr.forEach((mm) => {
					var delta =  mm.logicalBox.y - ending.logicalBox.y;
					if (delta > 0) {
						mm.setBox(svgHelpers.boxPoints(
                            mm.logicalBox.x,mm.logicalBox.y - delta,mm.logicalBox.width,mm.logicalBox.height+delta),
                            'vxSystem adjust for volta');
					}
				});
			});
		});
	}

	getMeasureByIndex(measureIndex,staffId) {
		for (var i = 0; i < this.smoMeasures.length; ++i) {
			var mm = this.smoMeasures[i];
			if (measureIndex === mm.measureNumber.measureNumber && staffId === mm.measureNumber.staffId) {
				return mm;
			}
		}
		return null;
	}

	// ## renderMeasure
	// ## Description:
	// Create the graphical (VX) notes and render them on svg.  Also render the tuplets and beam
	// groups
	renderMeasure(staffIndex, smoMeasure) {
		var systemIndex = smoMeasure.measureNumber.systemIndex;
		this.smoMeasures.push(smoMeasure);

		var vxMeasure = new VxMeasure(this.context, {
				smoMeasure: smoMeasure
			});

		vxMeasure.render();
		this.vxMeasures.push(vxMeasure);

		// Keep track of the y coordinate for the nth staff


		// keep track of left-hand side for system connectors
		if (systemIndex === 0) {
			if (staffIndex === 0) {
				this.leftConnector[0] = vxMeasure.stave;
			} else if (staffIndex > this.maxStaffIndex) {
				this.maxStaffIndex = staffIndex;
				this.leftConnector[1] = vxMeasure.stave;
			}
		} else if (smoMeasure.measureNumber.systemIndex > this.maxSystemIndex) {
			this.endcaps = [];
			this.endcaps.push(vxMeasure.stave);
			this.maxSystemIndex = smoMeasure.measureNumber.systemIndex;
		} else if (smoMeasure.measureNumber.systemIndex === this.maxSystemIndex) {
			this.endcaps.push(vxMeasure.stave);
		}
		this.measures.push(vxMeasure);
		// this._adjustBox(vxMeasure.renderedSize);
	}

	// ## cap
	// ## Description:
	// draw the system brackets.  I don't know why I call them a cap.
	cap() {
		$(this.context.svg).find('g.lineBracket-' + this.lineIndex).remove();
		var group = this.context.openGroup();
		group.classList.add('lineBracket-' + this.lineIndex);
		group.classList.add('lineBracket');
		if (this.leftConnector[0] && this.leftConnector[1]) {
			var c1 = new VF.StaveConnector(this.leftConnector[0], this.leftConnector[1])
				.setType(VF.StaveConnector.type.BRACKET);
			var c2 = new VF.StaveConnector(this.leftConnector[0], this.leftConnector[1])
				.setType(VF.StaveConnector.type.SINGLE);
			c1.setContext(this.context).draw();
			c2.setContext(this.context).draw();
		}
		this.context.closeGroup();
	}
}
