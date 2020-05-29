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
        this.staves = [];
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
			if (mm.noteToVexMap[smoNote.attrs.id]) {
				return mm.noteToVexMap[smoNote.attrs.id];
			}
		}
		return null;
	}

    // ### updateLyricOffsets
    // Adjust the y position for all lyrics in the line so they are even.
    // Also replace '-' with a longer dash do indicate 'until the next measure'
	updateLyricOffsets() {
    for (var i = 0;i < this.score.staves.length;++i) {
      // is this necessary? They should all be from the current line
      var vxMeasures = this.vxMeasures.filter((vx) => {
        return vx.smoMeasure.measureNumber.staffId == i;
      });
      // All the lyrics on this line
      var lyrics=[];
      var lyricsDash = [];

      // The vertical bounds on each line
      var verseLimits={};

      // The
      var lyricVerseMap = {};
      vxMeasures.forEach((mm) => {
        var smoMeasure = mm.smoMeasure;

        // Get lyrics from any voice.
        smoMeasure.voices.forEach((voice) => {
          voice.notes.forEach((note) => {
            note.getTrueLyrics().forEach((ll) => {
              if (!lyricVerseMap[ll.verse]) {
                lyricVerseMap[ll.verse] = [];
              }
              if (ll.logicalBox) {
                lyricVerseMap[ll.verse].push(ll);
                lyrics.push(ll);
              }
            });
          });
        });
      });
      var vkey = Object.keys(lyricVerseMap).sort((a,b) => a-b);
      vkey.forEach((verse) => {
          verseLimits[verse] = {highest:-1,bottom:-1};
          lyricVerseMap[verse].forEach((ll) => {
            verseLimits[verse].highest = Math.round(Math.max(ll.logicalBox.height,verseLimits[verse].highest));
            verseLimits[verse].bottom = Math.round(Math.max(ll.logicalBox.y + ll.logicalBox.height,verseLimits[verse].bottom));
          });
      });
      for (var j = 1; j < vkey.length;++j) {
        verseLimits[j].bottom = verseLimits[j-1].bottom + verseLimits[j-1].highest;
      }
      lyrics.forEach((lyric) => {
  			lyric.adjY = Math.round(verseLimits[lyric.verse].bottom -  lyric.logicalBox.y);
  			var dom = $(this.context.svg).find(lyric.selector)[0];
  			dom.setAttributeNS('','transform','translate('+lyric.adjX+' '+lyric.adjY+')');
        // Keep track of lyrics that are 'dash'
        if (lyric.getText().trim() == '-') {
          lyricsDash.push(lyric);
        }
		  });

      lyricsDash.forEach((lyric) => {
        var parent = $(this.context.svg).find(lyric.selector)[0];
        var line = document.createElementNS(svgHelpers.namespace,'line');
        var ymax = Math.round(lyric.logicalBox.y + lyric.logicalBox.height/2);
        var offset = Math.round(lyric.logicalBox.width/2);
        line.setAttributeNS('', 'x1', lyric.logicalBox.x - offset);
        line.setAttributeNS('', 'y1', ymax);
        line.setAttributeNS('', 'x2', lyric.logicalBox.x + lyric.logicalBox.width + offset);
        line.setAttributeNS('', 'y2', ymax);
        line.setAttributeNS('','stroke-width',1);
        line.setAttributeNS('','fill','none');
        line.setAttributeNS('','stroke','#999999');
        parent.appendChild(line);
        var text = $(this.context.svg).find(lyric.selector).find('text')[0];
        text.setAttributeNS('','fill','#fff');
      });
    }
	}

   // ### renderModifier
   // render a line-type modifier that is associated with a staff (e.g. slur)
	renderModifier(modifier, vxStart, vxEnd,smoStart,smoEnd) {
		// if it is split between lines, render one artifact for each line, with a common class for
		// both if it is removed.
		if (vxStart) {
		    $(this.context.svg).find('g.' +  modifier.attrs.id).remove();
        }
        var artifactId = modifier.attrs.id + '-' + this.lineIndex;
		var group = this.context.openGroup();
        var xtranslate = 0;
        var ytranslate = 0;
		group.classList.add(modifier.attrs.id);
		group.classList.add(artifactId);
		if ((modifier.ctor == 'SmoStaffHairpin' && modifier.hairpinType == SmoStaffHairpin.types.CRESCENDO) ||
			(modifier.ctor == 'SmoStaffHairpin' && modifier.hairpinType == SmoStaffHairpin.types.DECRESCENDO)) {
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
		} else if (modifier.ctor == 'SmoSlur') {
            var lyric = smoStart.note.longestLyric();
            var xoffset = 0;
            if (lyric && lyric.getText()) {
                // If there is a lyric, the bounding box of the start note is stretched to the right.
                // slide the slur left, and also make it a bit wider.
                xtranslate = (-1*lyric.getText().length * 6);
                xoffset += (xtranslate/2) - SmoSlur.defaults.xOffset;
            }
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
                tie_spacing:modifier.spacing
            });
curve.setContext(this.context).draw();
*/
		}

		this.context.closeGroup();
        if (xoffset) {
            var slurBox = $('.'+artifactId)[0];
            svgHelpers.translateElement(slurBox,xoffset,0);
        }
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
	renderMeasure(smoMeasure,measureMapper) {
        var staff = this.score.staves[smoMeasure.measureNumber.staffId];
        var staffId = staff.staffId;
		var systemIndex = smoMeasure.measureNumber.systemIndex;
        var selection = SmoSelection.measureSelection(this.score,staff.staffId,smoMeasure.measureNumber.measureIndex);
		this.smoMeasures.push(smoMeasure);
        if (this.staves.length <= staffId) {
            this.staves.push(staff);
        }

		var vxMeasure = new VxMeasure(this.context, {
				selection: selection
			});

        // create the vex notes, beam groups etc. for the measure
		vxMeasure.preFormat();
        this.vxMeasures.push(vxMeasure);

        var lastStaff = (staffId == this.score.staves.length-1);
        var smoGroupMap = {};

        // If this is the last staff in the column, render the column with justification
        if (lastStaff) {
            var ar = vxMeasure.voiceAr;
            this.vxMeasures.forEach((vv) => {
                if (!vv.rendered) {
                    var systemGroup = this.score.getSystemGroupForStaff(vv.selection);
                    var justifyGroup = systemGroup ? systemGroup.attrs.id : vv.selection.staff.attrs.id;
                    if (!smoGroupMap[justifyGroup]) {
                        smoGroupMap[justifyGroup] = {firstMeasure:vv,voices:[]};
                    }
                    smoGroupMap[justifyGroup].voices =
                        smoGroupMap[justifyGroup].voices.concat(vv.voiceAr);
                }
            });
        }
        var keys = Object.keys(smoGroupMap);
        keys.forEach((key) => {
            smoGroupMap[key].firstMeasure.format(smoGroupMap[key].voices);
        });
        if (lastStaff) {
            this.vxMeasures.forEach((vv) => {
                if (!vv.rendered) {
                  vv.render();
                  // unit test codes don't have tracker.
                  if (measureMapper) {
                      var tmpStaff = this.staves.find((ss) => ss.staffId == vv.smoMeasure.measureNumber.staffId);
                      measureMapper.mapMeasure(tmpStaff,vv.smoMeasure);
                  }
                }
            });
        }

		// Keep track of the y coordinate for the nth staff
        var renderedConnection = {};
        var brackets = false;

        if (systemIndex == 0 && lastStaff) {
            $(this.context.svg).find('g.lineBracket-' + this.lineIndex).remove();
            var group = this.context.openGroup();
            group.classList.add('lineBracket-' + this.lineIndex);
            group.classList.add('lineBracket');
            this.vxMeasures.forEach((vv) => {
                var systemGroup = this.score.getSystemGroupForStaff(vv.selection);
                if (systemGroup && !renderedConnection[systemGroup.attrs.id]) {
                    renderedConnection[systemGroup.attrs.id] = 1;
                    var startSel = this.vxMeasures[systemGroup.startSelector.staff];
                    var endSel = this.vxMeasures[systemGroup.endSelector.staff];
                    if (startSel && endSel) {
                        var c1 = new VF.StaveConnector(startSel.stave, endSel.stave)
            				.setType(systemGroup.leftConnectorVx());
                        c1.setContext(this.context).draw();
                        brackets = true;

                    }
                }
            });

            if (!brackets && this.vxMeasures.length > 1)  {
               var c2 = new VF.StaveConnector(this.vxMeasures[0].stave,this.vxMeasures[this.vxMeasures.length - 1].stave,
                  VF.StaveConnector.type.SINGLE_LEFT);
                  c2.setContext(this.context).draw();
           }
           this.context.closeGroup();
       }  else if (lastStaff && smoMeasure.measureNumber.measureIndex + 1 < staff.measures.length) {
           if (staff.measures[smoMeasure.measureNumber.measureIndex + 1].measureNumber.systemIndex == 0) {
               var endMeasure = vxMeasure;
               var startMeasure = this.vxMeasures.find((vv) => vv.selection.selector.staff == 0 &&
                   vv.selection.selector.measure == vxMeasure.selection.selector.measure);
              if (endMeasure && startMeasure) {
                  $(this.context.svg).find('g.endBracket-' + this.lineIndex).remove();
                  var group = this.context.openGroup();
                  group.classList.add('endBracket-' + this.lineIndex);
                  group.classList.add('endBracket');
               var c2 = new VF.StaveConnector(startMeasure.stave,endMeasure.stave)
                  .setType(VF.StaveConnector.type.SINGLE_RIGHT);
                  c2.setContext(this.context).draw();
                  this.context.closeGroup();
              }
           }

       }




		// keep track of left-hand side for system connectors
		if (systemIndex === 0) {
			if (staffId === 0) {
				this.leftConnector[0] = vxMeasure.stave;
			} else if (staffId > this.maxStaffIndex) {
				this.maxStaffIndex = staffId;
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

	}
}
