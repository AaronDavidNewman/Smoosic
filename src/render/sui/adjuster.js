
// ## suiAdjuster
// Perform adjustments on the score based on the rendered components so we can re-render it more legibly.
class suiAdjuster {	
		
	static _minMaxYModifier(staff,minY,maxY) {
		staff.modifiers.forEach((modifier) => {
			minY = modifier.logicalBox.y < minY ? modifier.logicalBox.y : minY;
			var max = modifier.logicalBox.y + modifier.logicalBox.height;
			maxY = max > maxY ? max : maxY;	 
			});

		return {minY:minY,maxY:maxY};
	}

	// ### adjustHeight
	// Handle measure bumping into each other, vertically.
	static adjustHeight(score,renderer) {
		var topStaff = score.staves[0];
		var maxLine = topStaff.measures[topStaff.measures.length - 1].lineIndex;
		var svg = renderer.getContext().svg;
		// array of the max Y measure per line, used to space next line down
		var maxYPerLine = [];
		var lineIndexPerLine = [];

		if (suiSimpleLayout.debugLayout) {
			$(renderer.getContext().svg).find('g.measure-adjust-dbg').remove();
		}
		var accum = 0;
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
				
				var modAdj = suiAdjuster._minMaxYModifier(staff,minYRenderedY,thisLineMaxY);
				minYRenderedY=modAdj.minY;
				thisLineMaxY=modAdj.maxY;

				maxYPerLine.push(thisLineMaxY);
				lineIndexPerLine.push(maxYMeasure.lineIndex);

				if (absLine == 0) {
					accum = score.layout.topMargin - minYRenderedY;					
					var staffY = minYStaffY+ accum;					
					measures.forEach((measure) => {
						measure.staffY = staffY;
						if (suiSimpleLayout.debugLayout) {
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
						var ll = measures.logicalBox;
						measure.staffY = staffY;
						if (suiSimpleLayout.debugLayout) {
							var dbgBox = svgHelpers.boxPoints(measure.staffX, measure.staffY, measure.staffWidth, measure.logicalBox.height);
							svgHelpers.debugBox(svg, dbgBox, 'measure-adjust-dbg', 10);
						}
					});
				}
			}
		}
	}
}