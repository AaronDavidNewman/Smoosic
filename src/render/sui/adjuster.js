
// ## suiAdjuster
// Perform adjustments on the score based on the rendered components so we can re-render it more legibly.
class suiLayoutAdjuster {

	static estimateMusicWidth(smoMeasure) {
		var width = 0;
		var tm = smoMeasure.tickmap();
		smoMeasure.voices.forEach((voice) => {
			var tickIndex = 0;
			voice.notes.forEach((note) => {
				width += vexGlyph.dimensions.noteHead.width + vexGlyph.dimensions.noteHead.spacingRight;
				width += vexGlyph.dimensions.dot.width * note.dots + vexGlyph.dimensions.dot.spacingRight * note.dots;
				note.pitches.forEach((pitch) => {
					var declared = tm.getActiveAccidental(pitch, tickIndex, smoMeasure.keySignature);

					if (pitch.accidental != declared || pitch.cautionary) {
						width += vexGlyph.accidental(pitch.accidental).width;
					}
				});
				tickIndex += 1;
			});
		});
		return width;
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
			width += vexGlyph.dimensions.timeSignature.width + vexGlyph.dimensions.timeSignature.spacingRight;
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

	static estimateMeasureWidth(renderer,measure,staffBox) {

		// Calculate the existing staff width, based on the notes and what we expect to be rendered.
		measure.staffWidth = suiLayoutAdjuster.estimateMusicWidth(measure);
		measure.adjX = suiLayoutAdjuster.estimateStartSymbolWidth(measure);
		measure.adjRight = suiLayoutAdjuster.estimateEndSymbolWidth(measure);
		measure.staffWidth = measure.staffWidth  + measure.adjX + measure.adjRight + measure.padLeft;

		// Calculate the space for left/right text which displaces the measure.
		var textOffsetBox=suiLayoutAdjuster.estimateTextOffset(renderer,measure);
		measure.staffX += textOffsetBox.x;
	}

	// ### justifyWidths
	// After we adjust widths so each staff has enough room, evenly distribute the remainder widths to the measures.
	static justifyWidths(score,renderer,pageSize) {
		var context = renderer.getContext();
		var svg = context.svg;

		if (suiLayoutBase.debugLayout) {
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
							return mm.staffWidth + mm.padLeft;
						}).reduce((a, b) => {
							return a + b
						});
					width += measures[0].staffX + score.layout.leftMargin;
					var just = Math.round((pageSize - width) / measures.length) - 1;
					if (just > 0) {
						var accum = 0;
						measures.forEach((mm) => {
							mm.staffWidth += just;
							mm.staffX += accum;
							accum += just;
							if (suiLayoutBase.debugLayout) {
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

	static _spaceNotes(svg,smoMeasure) {
		var g = svg.getElementById(smoMeasure.attrs.id);
        if (!g) {
            return;
        }
		var notes = Array.from(g.getElementsByClassName('vf-stavenote'));
		var acc = 0;
		for (var i = 1; i < notes.length; ++i) {
			var b1 = notes[i - 1].getBBox();
			var b2 = notes[i].getBBox();
			var dif = b2.x - (b1.x + b1.width);
			if (dif < 10) {
				acc += 10 - dif;
			}
		}
		smoMeasure.logicalBox.width += acc;
	}

    // ### adjustWidths
	// Set the width of each measure in a system to the max width for that column so the measures are aligned.
	static adjustWidths(score,renderer) {
		var topStaff = score.staves[0];
		var maxLine = topStaff.measures[topStaff.measures.length - 1].lineIndex;
		var svg = renderer.getContext().svg;
		if (suiLayoutBase.debugLayout) {
			$(renderer.getContext().svg).find('g.measure-adjust-dbg').remove();
		}

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
				measures.forEach((mm) => {suiLayoutAdjuster._spaceNotes(svg,mm);});

                // find the widest measure in this column, and adjust the others accordingly
				if (measures.length) {
					var widest = measures.map((x) => {
							return x.logicalBox.width + x.padLeft;
						}).reduce((a, w) => {
							return a > w ? a : w;
						});
					measures.forEach((measure) => {
						measure.staffWidth = widest;
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
					measure.staffX = last.staffX + last.staffWidth + last.padLeft;
				}
				if (suiLayoutBase.debugLayout) {
					var dbgBox = svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, measure.logicalBox.height);
					svgHelpers.debugBox(svg, dbgBox, 'measure-adjust-dbg', 10);
				}
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

	// ### adjustHeight
	// Handle measure bumping into each other, vertically.
	static adjustHeight(score,renderer,pageWidth,pageHeight) {
		var topStaff = score.staves[0];
		var maxLine = topStaff.measures[topStaff.measures.length - 1].lineIndex;
		var svg = renderer.getContext().svg;
		// array of the max Y measure per line, used to space next line down
		var maxYPerLine = [];
		var lineIndexPerLine = [];
        var vyMaxY = 0;

		if (suiLayoutBase.debugLayout) {
			$(renderer.getContext().svg).find('g.measure-adjust-dbg').remove();
		}
		var accum = 0;
		// iterate: system, staves within a system, measures
		for (var i = 0; i <= maxLine; ++i) {
			for (var j = 0; j < score.staves.length; ++j) {
				var absLine = score.staves.length * i + j;
				var staff = score.staves[j];
				var measures = staff.measures.filter((mm) => {
						return mm.lineIndex === i
					});

				if (measures.length === 0) {
					continue;
				}

                var measureNums = measures.map((mm)=> {
                    return mm.measureNumber.measureIndex;
                });
                var measureMax = measureNums.reduce((a,b) => a > b ? a : b);
                var measureMin = measureNums.reduce((a,b) => a < b ? a : b);

				// maxYMeasure is measure on this line with y closest to bottom of page (maxYMeasure y point)
				var maxYMeasure = measures.reduce((a, b) => {
						if (a.logicalBox.y + a.logicalBox.height >
							b.logicalBox.y + b.logicalBox.height) {
							return a;
						}
						return b;
					});
				// minYMeasure is measure on this line with y closest to top of the page
				var minYMeasure = measures.reduce((a, b) => {
						return a.logicalBox.y < b.logicalBox.y ? a : b;
					});

				var minYRenderedY = minYMeasure.logicalBox.y;
				var minYStaffY = minYMeasure.staffY;

				var thisLineMaxY = maxYMeasure.logicalBox.y + maxYMeasure.logicalBox.height;

				var modAdj = suiLayoutAdjuster._minMaxYModifier(staff,measureMin,measureMax,minYRenderedY,thisLineMaxY);
				minYRenderedY=modAdj.minY;
				thisLineMaxY=modAdj.maxY;

				maxYPerLine.push(thisLineMaxY);
				lineIndexPerLine.push(maxYMeasure.lineIndex);

				if (absLine == 0) {
					accum = score.layout.topMargin - minYRenderedY;
					var staffY = minYStaffY+ accum;
					measures.forEach((measure) => {
						measure.staffY = staffY;
                        vyMaxY = (vyMaxY > measure.staffY + measure.logicalBox.height) ? vyMaxY :
                           measure.staffY + measure.logicalBox.height;
						if (suiLayoutBase.debugLayout) {
							var dbgBox = svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, measure.logicalBox.height);
							svgHelpers.debugBox(svg, dbgBox, 'measure-adjust-dbg', 10);
						}
					});
				} else {
					var my = maxYPerLine[absLine - 1]  + score.layout.intraGap;
					var delta = my - minYRenderedY;
					if (lineIndexPerLine[absLine - 1] < minYMeasure.lineIndex) {
						delta += score.layout.interGap;
					}
					accum += delta;
					var staffY = minYStaffY + accum;
					measures.forEach((measure) => {
						measure.staffY = staffY;
                        vyMaxY = (vyMaxY > measure.staffY + measure.logicalBox.height) ? vyMaxY :
                           measure.staffY + measure.logicalBox.height;
						if (suiLayoutBase.debugLayout) {
							var dbgBox = svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, measure.logicalBox.height);
							svgHelpers.debugBox(svg, dbgBox, 'measure-adjust-dbg', 10);
						}
					});
				}
			}
		}

        // Finally, make sure each system does not run into the page break;
        var page = 1;
        var pageGap = 0;
        var pbrk = page * pageHeight;

        for (var i=0; i <= maxLine; ++i) {
            var measures=[];
            score.staves.forEach((staff) => {
                var delta = staff.measures.filter((mm) => {
                            return mm.lineIndex === i
                });
                measures = measures.concat(delta);
            });

            var miny = measures.reduce((a, b) => {
						return a.staffY < b.staffY ? a: b;
					});
            miny = miny.staffY;
            var maxy = measures.reduce((a, b) => {
                var ay = a.staffY + a.logicalBox.height;
                var by = b.staffY+ b.logicalBox.height;
						return  ay > by ? a : b;
					});
            maxy = maxy.staffY + maxy.logicalBox.height;

            // miny + x = pbrk + margin
            if (maxy > pbrk) {
                pageGap += pbrk - miny + score.layout.topMargin;
                page += 1;
                pbrk = page * pageHeight;
            }
            if (pageGap > 0) {
                measures.forEach((mm) => {
                    mm.staffY += pageGap;
                });
            }
        }
        if (page != score.layout.pages) {
            score.layout.pages = page;
        }
	}
}
