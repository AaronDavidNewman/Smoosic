
class SuiDom {
	static splash() {
		var b = htmlHelpers.buildDom;
		var r = b('div').classes('bug-modal').append(
				b('img').attr('src', '../styles/images/logo.png').classes('splash-logo'))
			.append(b('button').classes('icon icon-cross bug-dismiss-button'))
			.append(b('span').classes('splash-title').text('Sm'))
			.append(b('span').classes('splash-shine').text('ooooooooo'))
			.append(b('span').classes('splash-title').text('sic'));
		$('.bugDialog').append(r.dom());
		$('body').addClass('splashScreen modal');
		setTimeout(function () {
			$('body').removeClass('splashScreen modal');
		}, 1000);
	}

  splash() {
    var b = htmlHelpers.buildDom;
    var r = b('div').classes('bug-modal').append(
        b('img').attr('src', 'styles/images/logo.png').classes('splash-logo'))
      .append(b('button').classes('icon icon-cross bug-dismiss-button'))
      .append(b('span').classes('splash-title').text('Sm'))
      .append(b('span').classes('splash-shine').text('ooooooooo'))
      .append(b('span').classes('splash-title').text('sic'));
    $('.bugDialog').append(r.dom());
    $('body').addClass('splashScreen modal');
    setTimeout(function () {
      $('body').removeClass('splashScreen modal');
    }, 1000);
  }

	static createDom(title) {
    if (title) {
  	  $('h1.testTitle').text(title);
  	}

    var b = htmlHelpers.buildDom;
    var r=b('div').classes('dom-container')
      .append(b('div').classes('modes'))
      .append(b('div').classes('overlay'))
      .append(b('div').classes('draganime hide'))
      .append(b('div').classes('textEdit hide'))
      .append(b('div').classes('attributeDialog'))
      .append(b('div').classes('helpDialog'))
      .append(b('div').classes('saveLink'))
      .append(b('div').classes('bugDialog'))
      .append(b('div').classes('printFrame'))
      .append(b('div').classes('menuContainer'))
      .append(b('h1').classes('testTitle').text('Smoosic'))
      .append(b('div').classes('piano-container')
      .append(b('div').classes('piano-keys')))
      .append(b('div').classes('workspace-container')
      .append(b('div').classes('workspace')
        .append(b('div').classes('controls-top'))
        .append(b('div').classes('controls-left'))
        .append(b('div').classes('controls-menu-message'))
        .append(b('div').classes('musicRelief')
          .append(b('div').classes('musicContainer').attr('id','boo')))
          .append(b('div').classes('musicReliefShadow')
            .append(b('div').classes('musicContainerShadow').attr('id','booShadow')))));
    $('#smoo').append(r.dom());
    var pianoDom=$('.piano-keys')[0];
    var svg=document.createElementNS(svgHelpers.namespace,'svg');
    svg.id='piano-svg';
    svg.setAttributeNS('','width',''+suiPiano.owidth*suiPiano.dimensions.octaves);
    svg.setAttributeNS('','height',''+suiPiano.dimensions.wheight);
    svg.setAttributeNS('','viewBox','0 0 '+suiPiano.owidth*suiPiano.dimensions.octaves+' '+suiPiano.dimensions.wheight);
    pianoDom.appendChild(svg);
	}

  static _nvQueryPair(str) {
      var ar = str.split('=');
      var rv = {};
      for (var i =  0;i < ar.length - 1;i += 2) {
          var name = decodeURIComponent(ar[i]);
          rv[name] = decodeURIComponent(ar[i+1]);
      }
      return rv;
  }

  static scoreFromQueryString() {
    var score = SmoScore.deserialize(basicJson);
    if (window.location.search) {
      var cmd = window.location.search.substring(1,window.location.search.length);
      var pairs = suiController._nvQueryPair(cmd);
      if (pairs['score']) {
          try {
              score = SmoScore.deserialize(eval(pairs['score']));
          } catch (exp) {
              console.log('could not parse '+exp);
          }
      }
    } else {
      var scoreStr = localStorage.getItem(smoSerialize.localScore);
      if (scoreStr && scoreStr.length) {
        try {
          score = SmoScore.deserialize(scoreStr);
        } catch (exp) {
          console.log('could not parse '+scoreStr);
        }
      }
    }
    return score;
  }
}

class UtDom {
  	static createDom() {
  		var b = htmlHelpers.buildDom;
  		$('#smoo').html('');
  		var r = b('div').classes('dom-container')
  			.append(b('div').classes('modes'))
  			.append(b('div').classes('overlay'))
  			.append(b('div').classes('attributeDialog'))
  			.append(b('div').classes('helpDialog'))
  			.append(b('div').classes('menuContainer'))
  			.append(b('h1').classes('testTitle').text('Smoosic'))
  			.append(b('h2').classes('subTitle'))
  			.append(b('div').classes('piano-container')
  				.append(b('div').classes('piano-keys')))
  			.append(b('div').classes('workspace-container')
  				.append(b('div').classes('workspace')
  					.append(b('div').classes('controls-top'))
  					.append(b('div').classes('controls-left'))
  					.append(b('div').classes('musicRelief')
  						.append(b('div').classes('musicContainer').attr('id', 'boo')))));
  		$('#smoo').append(r.dom());
  	}
}
