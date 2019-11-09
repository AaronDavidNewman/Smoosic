
class suiTextLayout {
	
	static _getTextBox(scoreText,parameters) {
		var svg = parameters.svg;
		if (scoreText.width && scoreText.height && scoreText.boxModel == SmoScoreText.boxModels.wrap) {
			return svgHelpers.boxPoints(scoreText.x,scoreText.y,scoreText.width,scoreText.height);
		}
		return svgHelpers.getTextBox(svg,scoreText.toSvgAttributes(),scoreText.classes,scoreText.text);		
	}
	static _saveBox(scoreText,parameters,el) {
		var svg = parameters.svg;
		 var box = svgHelpers.smoBox(el.getBoundingClientRect());
		 var lbox = svgHelpers.clientToLogical(svg,box);
		 scoreText.renderedBox = {
			x: box.x,
			y: box.y,
			height: box.height,
			width: box.width
		};
		scoreText.logicalBox = lbox;
	}
	static titleTextPlacement(scoreText,parameters) {
		var svg = parameters.svg;
		var bbox = suiTextLayout._getTextBox(scoreText,parameters);
		scoreText.x=parameters.width/2-(bbox.width/2);
		scoreText.y=parameters.layout.topMargin;
		parameters.layout.topMargin += bbox.height;
		scoreText.autoLayout=false; // use custom placement or calculated placement next time
		suiTextLayout.placeText(scoreText,parameters);
	}
	
	static headerTextPlacement(scoreText,parameters) {
		var svg = parameters.svg;
		var bbox = suiTextLayout._getTextBox(scoreText,parameters);
		scoreText.x=parameters.width/2-(bbox.width/2);
		scoreText.y=10;
		scoreText.autoLayout=false;
		suiTextLayout.placeText(scoreText,parameters);
	}
	
	static footerTextPlacement(scoreText,parameters) {
		var svg = parameters.svg;
		var bbox = suiTextLayout._getTextBox(scoreText,parameters);
		scoreText.x=parameters.width/2-(bbox.width/2);
		scoreText.y=parameters.height-(bbox.height+10);
		scoreText.autoLayout=false;
		suiTextLayout.placeText(scoreText,parameters);
	}
	
	static copyrightTextPlacement(scoreText,parameters) {
		var svg = parameters.svg;
		var bbox = suiTextLayout._getTextBox(scoreText,parameters);
		scoreText.x=parameters.width-(bbox.width+10);
		scoreText.y=10;
		suiTextLayout.placeText(scoreText,parameters);
		scoreText.autoLayout=false;
	}
	
	static placeText(scoreText,parameters) {
		var svg = parameters.svg;
		if (scoreText.width && scoreText.height && scoreText.boxModel == SmoScoreText.boxModels.wrap) {
    		suiTextLayout.placeWithWrap(scoreText,parameters);
		} else {
			var el = svgHelpers.placeSvgText(svg,scoreText.toSvgAttributes(),scoreText.classes,scoreText.text);	
            suiTextLayout._saveBox(scoreText,parameters,el);
		}
	}
	
	
	static _placeWithWrap(scoreText,parameters,justification) {
		var justifyOnly=false;
		if (!justification.length) {
			justifyOnly=true;
		}
		var svg = parameters.svg;
		var words = scoreText.text.split(' ');		
		var curx = scoreText.x;
		var left = curx;
		var right = scoreText.x+scoreText.width;
		var top = scoreText.y;
		var params = scoreText.backupParams();
		var cury = scoreText.y;
		var width=	scoreText.width;
		var height = scoreText.height;
		var delta = 0;
		params.boxModel = SmoScoreText.boxModels.none;
		params.width=0;
		params.height = 0;
		scoreText.logicalBox=svgHelpers.boxPoints(scoreText.x,scoreText.y,scoreText.width,scoreText.height);
		scoreText.renderedBox = svgHelpers.logicalToClient(svg,scoreText.logicalBox);
		var justifyAmount = justifyOnly ? 0 : justification[0];
		if(!justifyOnly) {
		    justification.splice(0,1);
		}
		
		words.forEach((word) => {
			var bbox = svgHelpers.getTextBox(svg,SmoScoreText.toSvgAttributes(params),scoreText.classes,word);
			delta = right - (bbox.width + bbox.x);
			if (delta > 0) {
				params.x=bbox.x;
				params.y=cury;
				if (!justifyOnly) {
                   params.x += justifyAmount;					
				   svgHelpers.placeSvgText(svg,SmoScoreText.toSvgAttributes(params),scoreText.classes,word);
				} 
			} else {
				if (!justifyOnly) {
					justifyAmount = justification[0];
				    justification.splice(0,1);
				} else {
					// If we are computing for justification, do that.
					delta = right - bbox.x;
					delta = scoreText.justification === SmoScoreText.justifications.right ? delta :
					    (scoreText.justification === SmoScoreText.justifications.center ? delta/2 : 0);
					justification.push(delta);
				}
				cury += bbox.height;
				curx = left;
				params.x=curx + justifyAmount;
				params.y=cury;
				if (!justifyOnly) {
				    svgHelpers.placeSvgText(svg,SmoScoreText.toSvgAttributes(params),scoreText.classes,word);
				}
			}
			curx += bbox.width + 5;
			params.x = curx;
			// calculate delta in case this is last time			
			delta = right - curx; 
		});	
		delta = scoreText.justification === SmoScoreText.justifications.right ? delta :
					    (scoreText.justification === SmoScoreText.justifications.center ? delta/2 : 0);
        justification.push(delta-5);		
	}
	static placeWithWrap(scoreText,parameters) {
		var justification=[];
		
		// One pass is to compute justification for the box model.
		suiTextLayout._placeWithWrap(scoreText,parameters,justification);
		suiTextLayout._placeWithWrap(scoreText,parameters,justification);
	}

}