
// ## suiAdjuster
// Perform adjustments on the score based on the rendered components so we can re-render it more legibly.
class suiLayoutAdjuster {

	static estimateMusicWidth(smoMeasure) {
		var widths = [];
        var voiceIx = 0;
        var tmObj = smoMeasure.createMeasureTickmaps();
		smoMeasure.voices.forEach((voice) => {
			var tickIndex = 0;
            var width = 0;
            var duration = 0;
            var tm = tmObj.tickmaps[voiceIx];
			voice.notes.forEach((note) => {
                var noteWidth = 0;
                var dots = (note.dots ? note.dots : 0);
				noteWidth += vexGlyph.dimensions.noteHead.width + vexGlyph.dimensions.noteHead.spacingRight;
				noteWidth += vexGlyph.dimensions.dot.width * dots + vexGlyph.dimensions.dot.spacingRight * dots;
				note.pitches.forEach((pitch) => {
                    var keyAccidental = smoMusic.getAccidentalForKeySignature(pitch,smoMeasure.keySignature);
                    var accidentals = tmObj.accidentalArray.filter((ar) =>
                        ar.duration < duration && ar.pitches[pitch.letter]);
                    var acLen = accidentals.length;
                    var declared = acLen > 0 ?
                        accidentals[acLen - 1].pitches[pitch.letter].pitch.accidental: keyAccidental;

                    if (declared != pitch.accidental
                        || pitch.cautionary) {
						noteWidth += vexGlyph.accidental(pitch.accidental).width;
					}
				});

                var verse = 0;
                var lyric;
                while (lyric = note.getLyricForVerse(verse)) {
                    // TODO: kerning and all that...
                    if (!lyric.length) {
                        break;
                    }
                    // why did I make this return an array?
                    // oh...because of voices
                    var lyricWidth = 6*lyric[0].text.length + 10;
                    noteWidth = Math.max(lyricWidth,noteWidth);

                    verse += 1;
                }

				tickIndex += 1;
                duration += note.tickCount;
                width += noteWidth;
			});
            voiceIx += 1;
            widths.push(width);
		});
        widths.sort((a,b) => a > b ? -1 : 1);
		return widths[0];
	}

	static estimateStartSymbolWidth(smoMeasure) {
		var width = 0;
		if (smoMeasure.forceKeySignature) {
			if ( smoMeasure.canceledKeySignature) {
			    width += vexGlyph.keySignatureLength(smoMeasure.canceledKeySignature);
			}
            width += vexGlyph.keySignatureLength(smoMeasure.keySignature);
		}
		if (smoMeasure.forceClef) {
			width += vexGlyph.clef(smoMeasure.clef).width + vexGlyph.clef(smoMeasure.clef).spacingRight;
		}
		if (smoMeasure.forceTimeSignature) {
            var digits = smoMeasure.timeSignature.split('/')[0].length;
			width += vexGlyph.dimensions.timeSignature.width*digits + vexGlyph.dimensions.timeSignature.spacingRight;
		}
		var starts = smoMeasure.getStartBarline();
		if (starts) {
			width += vexGlyph.barWidth(starts);
		}
		return width;
	}

	static estimateEndSymbolWidth(smoMeasure) {
		var width = 0;
		var ends  = smoMeasure.getEndBarline();
		if (ends) {
			width += vexGlyph.barWidth(ends);
		}
		return width;
	}


	static estimateTextOffset(renderer,smoMeasure) {
		var leftText = smoMeasure.modifiers.filter((mm) => mm.ctor==='SmoMeasureText' && mm.position === SmoMeasureText.positions.left);
		var rightText = smoMeasure.modifiers.filter((mm) => mm.ctor==='SmoMeasureText' && mm.position === SmoMeasureText.positions.right);
		var svg = renderer.getContext().svg;
		var xoff=0;
		var width=0;
		leftText.forEach((tt) => {
    		var testText = new SmoScoreText({text:tt.text});
    		var box = svgHelpers.getTextBox(svg,testText.toSvgAttributes(),testText.classes,testText.text);
			xoff += box.width;
		});
		rightText.forEach((tt) => {
    		var testText = new SmoScoreText({text:tt.text});
			var box = svgHelpers.getTextBox(svg,testText.toSvgAttributes(),testText.classes,testText.text);
			width += box.width;
		});
		return svgHelpers.boxPoints(xoff,0,width,0);
	}

	static estimateMeasureWidth(measure) {

		// Calculate the existing staff width, based on the notes and what we expect to be rendered.
        var gravity = false;
        var prevWidth = measure.staffWidth;
		var measureWidth = suiLayoutAdjuster.estimateMusicWidth(measure);
		measure.adjX = suiLayoutAdjuster.estimateStartSymbolWidth(measure);
		measure.adjRight = suiLayoutAdjuster.estimateEndSymbolWidth(measure);
		measureWidth += measure.adjX + measure.adjRight;
        if (measure.changed == false && measure.logicalBox && measure.staffWidth < prevWidth) {
            measureWidth = Math.round((measure.staffWidth + prevWidth)/2);
            gravity = true;
        }
        measure.setWidth(measureWidth,'estimateMeasureWidth adjX adjRight gravity: '+gravity);

		// Calculate the space for left/right text which displaces the measure.
		// var textOffsetBox=suiLayoutAdjuster.estimateTextOffset(renderer,measure);
		// measure.setX(measure.staffX  + textOffsetBox.x,'estimateMeasureWidth');
        measure.setBox(svgHelpers.boxPoints(measure.staffX,measure.staffY,measure.staffWidth,measure.logicalBox.height),
           'estimate measure width');

	}
    static _beamGroupForNote(measure,note) {
        var rv = null;
        if (!note.beam_group) {
            return null;
        }
        measure.beamGroups.forEach((bg) => {
            if (!rv) {
                if (bg.notes.findIndex((nn) => note.beam_group && note.beam_group.id == bg.attrs.id) >= 0) {
                    rv = bg;
                }
            }
        });
        return rv;
    }

    // ### _highestLowestHead
    // highest value is actually the one lowest on the page
    static _highestLowestHead(measure,note) {
        var hilo = {hi:0,lo:9999999};
        note.pitches.forEach((pitch) => {
            // 10 pixels per line
            var px = 10*smoMusic.pitchToLedgerLine(measure.clef,pitch);
            hilo.lo = Math.min(hilo.lo,px);
            hilo.hi = Math.max(hilo.hi,px);
        });
        return hilo;
    }

    // ### estimateMeasureHeight
    // The baseline is the top line of the staff.  aboveBaseline is a negative number
    // that indicates how high above the baseline the measure goes.  belowBaseline
    // is a positive number that indicates how far below the baseline the measure goes.
    // the height of the measure is below-above.  Vex always renders a staff such that
    // the y coordinate passed in for the stave is on the baseline.
    static estimateMeasureHeight(measure,layout) {
        var heightOffset = 50;  // assume 5 lines, todo is non-5-line staffs
        var yOffset = 0;
        if (measure.forceClef) {
            heightOffset += vexGlyph.clef(measure.clef).yTop + vexGlyph.clef(measure.clef).yBottom;
            yOffset = yOffset - vexGlyph.clef(measure.clef).yTop;
        }

        if (measure.forceTempo) {
            yOffset = Math.min(-1*vexGlyph.tempo.yTop,yOffset);
        }
        var hasDynamic = false;

        measure.voices.forEach((voice) => {
            voice.notes.forEach((note) => {
                var bg = suiLayoutAdjuster._beamGroupForNote(measure,note);
                var flag = SmoNote.flagStates.auto;
                if (bg && note.noteType == 'n') {
                    flag = bg.notes[0].flagState;
                    // an  auto-flag note is up if the 1st note is middle line
                    if (flag == SmoNote.flagStates.auto) {
                        var pitch = bg.notes[0].pitches[0];
                        flag = smoMusic.pitchToLedgerLine(measure.clef,pitch)
                           >= 2 ? SmoNote.flagStates.up : SmoNote.flagStates.down;
                    }
                }  else {
                    var flag = note.flagState;
                    // an  auto-flag note is up if the 1st note is middle line
                    if (flag == SmoNote.flagStates.auto) {
                        var pitch = note.pitches[0];
                        flag = smoMusic.pitchToLedgerLine(measure.clef,pitch)
                           >= 2 ? SmoNote.flagStates.up : SmoNote.flagStates.down;
                    }
                }
                var hiloHead = suiLayoutAdjuster._highestLowestHead(measure,note);
                if (flag == SmoNote.flagStates.down) {
                    yOffset = Math.min(hiloHead.lo,yOffset);
                    heightOffset = Math.max(hiloHead.hi + vexGlyph.stem.height,heightOffset);
                } else {
                    yOffset = Math.min(hiloHead.lo - vexGlyph.stem.height,yOffset);
                    heightOffset = Math.max(hiloHead.hi,heightOffset);
                }
                var dynamics = note.getModifiers('SmoDynamicText');
                dynamics.forEach((dyn) => {
                    heightOffset = Math.max((10*dyn.yOffsetLine - 50) + 11,heightOffset);
                    yOffset = Math.min(10*dyn.yOffsetLine - 50,yOffset)
                });
            });
        });
        return {belowBaseline:heightOffset,aboveBaseline:yOffset};
    }

    static adjustSystemForPage(score,lineIndex,svgScale) {
        // svgScale = 1.0;
        var ar = [];
        var pageSize = score.layout.pageHeight / svgScale;
        var bm = score.layout.bottomMargin/svgScale;
        var tm = score.layout.topMargin/svgScale;
        score.staves.forEach((staff) => {
            var mar = staff.measures.filter((mm) => mm.lineIndex == lineIndex);
            ar = ar.concat(mar);
        });
        var minMeasure  = ar[0];
        var maxMeasure = minMeasure;
        ar.forEach((mm) => {
            minMeasure = (mm.logicalBox.y < minMeasure.logicalBox.y)
               ? mm : minMeasure;
            maxMeasure =  (mm.logicalBox.y + mm.logicalBox.height >
                maxMeasure.logicalBox.y + maxMeasure.logicalBox.height)
               ? mm : maxMeasure;
        });
        var height = (maxMeasure.logicalBox.y + maxMeasure.logicalBox.height) -
            minMeasure.logicalBox.y;
        var page = Math.floor((minMeasure.logicalBox.y + pageSize)
            / pageSize);
        var thresh = pageSize * page - bm;
        var maxHeight = maxMeasure.logicalBox.y + maxMeasure.logicalBox.height;
        if (maxHeight > thresh && height < score.layout.pageHeight) {
            page += 1;
            var adj = (thresh-minMeasure.logicalBox.y)  + bm + tm;
            ar.forEach((mm) => {
                mm.setBox(svgHelpers.boxPoints(mm.logicalBox.x,mm.logicalBox.y + adj,
                    mm.logicalBox.width,mm.logicalBox.height),'adjustSystemForPage');
                mm.setY(mm.staffY + adj,'adjustSystemForPage');
            });
        }
        return page;
    }

    // ### _adjustTopYLeft
    // Adjust the start y for all the measures to the left of this systems
    // once we know that it will not wrap.
    static adjustYEstimates(score,lineIndex) {
        var rightMeasures = [];
        score.staves.forEach((staff) => {
            var mms = staff.measures.filter((mm) => mm.lineIndex == lineIndex);
            rightMeasures.push(mms.reduce((a,b) => a.measureNumber > b.measureNumber ? a : b));
        });
        rightMeasures.forEach((rightmost) => {
            var measure = rightmost;
            var staff = score.staves[measure.measureNumber.staffId];
            var index = measure.measureNumber.measureIndex;
            while (index > 0 && staff.measures[index-1].lineIndex == lineIndex) {
                var prev = staff.measures[index-1];
                index -= 1;
                if (prev.yTop > measure.yTop) {
                    prev.setY(prev.staffY + prev.yTop,'_adjustYEstimates 1');
                    var ll = prev.logicalBox;
                    prev.setBox(svgHelpers.boxPoints(ll.x,ll.y - prev.yTop,ll.width,ll.height),'_adjustYEstimates 1');
                    prev.setYTop(measure.yTop,'_adjustYEstimates');
                    prev.setY(prev.staffY - prev.yTop,'_adjustYEstimates 2');
                    prev.setBox(svgHelpers.boxPoints(ll.x,ll.y + prev.yTop,ll.width,ll.height),'_adjustYEstimates 2');
                }
            }
        });
    }

    static adjustWidthEstimates(score,lineIndex) {
        var ar = [];
        var pageSize = score.layout.pageHeight / svgScale;
        var bm = score.layout.bottomMargin/svgScale;
        var tm = score.layout.topMargin/svgScale;

        score.staves.forEach((staff) => {
            var mar = staff.measures.filter((mm) => mm.lineIndex == lineIndex);
            ar = ar.concat(mar);
        });
        var maxSystem = ar.map((mm) => {
                return mm.measureNumber.systemIndex;
            }).reduce((a, b) => {
                return a > b ? a : b
            });

        for (var i = 0;i <= maxSystem;++i) {
            var ixar = ar.filter((mm) => mm.measureNumber.systemIndex == i);
            var minx = ixar.map((mm) => mm.staffX).reduce((a,b) => {return (a < b) ? a : b});
            var minw = ixar.map((mm) => mm.staffWidth).reduce((a,b) => {return (a > b) ? a : b});
        }
    }


	// ### justifyWidths
	// After we adjust widths so each staff has enough room, evenly distribute the remainder widths to the measures.
	static justifyWidths(score,renderer,pageSize) {
		var context = renderer.getContext();
		var svg = context.svg;

		if (layoutDebug.flagSet['adjust']) {
			$(context.svg).find('g.measure-adjust-dbg').remove();
		}
		var topStaff = score.staves[0];
		var maxLine = topStaff.measures[topStaff.measures.length - 1].lineIndex;
		for (var i = 0; i <= maxLine; ++i) {
			var systemIndex = 0;

			score.staves.forEach((staff) => {
				var measures = staff.measures.filter((mm) => {
						return mm.lineIndex === i
					});
				if (measures.length > 0) {
					var width = measures.map((mm) => {
							return mm.staffWidth;
						}).reduce((a, b) => {
							return a + b
						});
                    // round justification down so it does not cause un-necessary wrapping
					var just = Math.floor((pageSize - width) / measures.length) - 1;
					if (just > 0) {
						var accum = 0;
						measures.forEach((mm) => {
							mm.setWidth(Math.floor(mm.staffWidth + just),'justifyWidths 1');
							mm.setX(mm.staffX+ accum,'justifyWidths');
							accum += just;
							if (layoutDebug.flagSet('adjust')) {
								var dbgBox = svgHelpers.boxPoints(
										mm.staffX, mm.staffY, mm.staffWidth, mm.logicalBox.height);
								svgHelpers.debugBox(svg, dbgBox, 'measure-adjust-dbg', 10);
							}
						});
					}
				}
			});
		}
	}

    // ### adjustWidths
	// Set the width of each measure in a system to the max width for that column so the measures are aligned.
	static adjustWidths(score,renderer) {
		var topStaff = score.staves[0];
		var maxLine = topStaff.measures[topStaff.measures.length - 1].lineIndex;
		var svg = renderer.getContext().svg;
		layoutDebug.clearDebugBoxes('adjust');

        // go through each system, vertically
		for (var i = 0; i <= maxLine; ++i) {
			var systemIndex = 0;
			while (true) {
				var measures = [];
                // Get all the measures on this line in this 'column'
				score.staves.forEach((staff) => {
					var ix = staff.measures.findIndex((x) => {
							return x.lineIndex === i && x.measureNumber.systemIndex === systemIndex;
						});
					if (ix >= 0) {
						measures.push(staff.measures[ix]);
					}
				});
				// Make sure each note head is not squishing
				// measures.forEach((mm) => {suiLayoutAdjuster._spaceNotes(svg,mm);});

                // find the widest measure in this column, and adjust the others accordingly
				if (measures.length) {
					var widest = measures.map((x) => {
							return x.staffWidth;
						}).reduce((a, w) => {
							return a > w ? a : w;
						});
					measures.forEach((measure) => {
						measure.setWidth(widest,'adjustWidths widest in column');
						measure.setChanged();
					});
				}
				if (!measures.length)
					break;
				systemIndex += 1;
			}
		}

		score.staves.forEach((staff) => {
			var last = null;
			staff.measures.forEach((measure) => {
				if (last && measure.measureNumber.systemIndex > 0) {
					measure.setX( last.staffX + last.staffWidth,'adjust widths');
				}
                layoutDebug.debugBox(svg,svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, measure.logicalBox.height),'adjust');
				last = measure;
			});
		});

	}

    // ### _minMaxYModifier
    // Helper function to calculate or update the min, max y of a staff
	static _minMaxYModifier(staff,minMeasure,maxMeasure,minY,maxY) {
		staff.modifiers.forEach((modifier) => {
            if (modifier.startSelector.measure >= minMeasure && modifier.startSelector <= maxMeasure) {
                minY = modifier.logicalBox.y < minY ? modifier.logicalBox.y : minY;
                var max = modifier.logicalBox.y + modifier.logicalBox.height;
                maxY = max > maxY ? max : maxY;
            }
			});

		return {minY:minY,maxY:maxY};
	}
}
