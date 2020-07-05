
class suiPiano {
	constructor(parameters) {
    Vex.Merge(this, parameters);
		this.renderElement = document.getElementById('piano-svg');
		this.selections = [];
		this.render();
    this.octaveOffset = 0;
    this.chordPedal = false;
	}

	static get dimensions() {
		return {
			wwidth: 23,
			bwidth: 13,
			wheight: 120,
			bheight: 80,
			octaves:1
		};
	}
		// 7 white keys per octave
	static get wkeysPerOctave() {
		return 7;
	}
	static get owidth() {
		return suiPiano.dimensions.wwidth * suiPiano.wkeysPerOctave;
	}

	static createAndDisplay(parms) {
		// Called by ribbon button.
		// $('body').toggleClass('show-piano');
        $('body').trigger('show-piano-event');
		$('body').trigger('forceScrollEvent');
		// handle resize work area.
	}
	_mapKeys() {
		this.objects = [];
		var keys = [].slice.call(this.renderElement.getElementsByClassName('piano-key'));
		keys.forEach((key) => {
			var rect = svgHelpers.smoBox(key.getBoundingClientRect());
			var id = key.getAttributeNS('', 'id');
			var artifact = {
				keyElement: key,
				box: rect,
				id: id
			};
			this.objects.push(artifact);
		});
	}
	_removeClass(classes) {
		Array.from(this.renderElement.getElementsByClassName('piano-key')).forEach((el) => {
			$(el).removeClass(classes);
		});
	}
	_removeGlow() {
		this._removeClass('glow-key');
	}
	_fadeGlow(el) {
		if (this['suggestFadeTimer']) {
			clearTimeout(this.suggestFadeTimer);
		}
		// Make selection fade if there is a selection.
		this.suggestFadeTimer = setTimeout(function () {
				$(el).removeClass('glow-key');
			}, 1000);
	}
	bind() {
		var self = this;
    $('body').off('show-piano-event').on('show-piano-event',function() {
        $('body').toggleClass('show-piano');
        self._mapKeys();
    });
    $('#piano-8va-button').off('click').on('click',function() {
      $('#piano-8vb-button').removeClass('activated');
      if (self.octaveOffset === 0) {
        $(this).addClass('activated');
        self.octaveOffset = 1;
      } else {
        $(this).removeClass('activated');
        self.octaveOffset = 0;
      }
    });
    $('#piano-8vb-button').off('click').on('click',function() {
      $('#piano-8va-button').removeClass('activated');
      if (self.octaveOffset === 0) {
        $(this).addClass('activated');
        self.octaveOffset = -1;
      } else {
        $(this).removeClass('activated');
        self.octaveOffset = 0;
      }
    });
    $('#piano-xpose-up').off('click').on('click',function() {
      self.editor.transposeUp();
    });
    $('#piano-xpose-down').off('click').on('click',function() {
      self.editor.transposeDown();
    });
    $('#piano-enharmonic').off('click').on('click',function() {
      self.editor.toggleEnharmonic();
    });
    $('button.jsLeft').off('click').on('click',function() {
      self.tracker.moveSelectionLeft();
    });
    $('button.jsRight').off('click').on('click',function() {
      self.tracker.moveSelectionRight();
    });
    $('button.jsGrowDuration').off('click').on('click',function() {
      self.editor.doubleDuration();
    });
    $('button.jsGrowDot').off('click').on('click',function() {
      self.editor.dotDuration();
    });
    $('button.jsShrinkDuration').off('click').on('click',function() {
      self.editor.halveDuration();
    });
    $('button.jsShrinkDot').off('click').on('click',function() {
      self.editor.undotDuration();
    });
    $('button.jsChord').off('click').on('click',function() {
      $(this).toggleClass('activated');
      self.chordPedal = !self.chordPedal;
    });


  	$(this.renderElement).off('mousemove').on('mousemove', function (ev) {
      if (Math.abs(self.objects[0].box.x - self.objects[0].keyElement.getBoundingClientRect().x)
        > self.objects[0].box.width/2) {
          console.log('remap piano');
          self._mapKeys();
        }
  		var keyPressed = svgHelpers.findSmallestIntersection({
				x: ev.clientX,
				y: ev.clientY
			}, self.objects,{x:0,y:0});
  		if (!keyPressed) {
  			return;
  		}
  		var el = self.renderElement.getElementById(keyPressed.id);
  		if ($(el).hasClass('glow-key')) {
  			return;
  		}
  		self._removeGlow();
  		$(el).addClass('glow-key');
  		self._fadeGlow(el);
  	});
  	$(this.renderElement).off('blur').on('blur',function(ev) {
  		self._removeGlow();
  	});
  	$(this.renderElement).off('click').on('click', function (ev) {
  		self._updateSelections(ev);
  	});

		$('.close-piano').off('click').on('click', function () {
			$('body').removeClass('show-piano');
			// resize the work area.
			$('body').trigger('forceScrollEvent');
		});
	}
	_updateSelections(ev) {
		var keyPressed = svgHelpers.findSmallestIntersection({
				x: ev.clientX,
				y: ev.clientY
			}, this.objects,{x:0,y:0});
		if (!keyPressed) {
			return;
		}
		if (!ev.shiftKey && !this.chordPedal) {
			this.selections = [];
			this._removeClass('glow-key pressed-key');
		} else {
			var el = this.renderElement.getElementById(keyPressed.id);
			$(el).addClass('pressed-key');
		}
		var key = keyPressed.id.substr(6, keyPressed.id.length - 6);
		var pitch = {
			letter: key[0].toLowerCase(),
			octave: parseInt(key[key.length - 1]),
			accidental: key.length == 3 ? key[1] : 'n'
		};
		this.selections.push(pitch);
    this.playNote();
	}
	_renderControls() {
		var b = htmlHelpers.buildDom;
		var r =b('button').classes('icon icon-cross close close-piano');
		$('.piano-container .key-right-ctrl').append(r.dom());
    r = b('button').classes('piano-ctrl jsGrowDuration').append(b('span').classes('icon icon-duration_grow'));
    $('.piano-container .key-right-ctrl').append(r.dom());
    r = b('button').classes('piano-ctrl jsShrinkDuration').append(b('span').classes('icon icon-duration_less'));
    $('.piano-container .key-right-ctrl').append(r.dom());
    r = b('button').classes('piano-ctrl jsGrowDot').append(b('span').classes('icon icon-duration_grow_dot'));
    $('.piano-container .key-right-ctrl').append(r.dom());
    r = b('button').classes('piano-ctrl jsShrinkDot').append(b('span').classes('icon icon-duration_less_dot'));
    $('.piano-container .key-right-ctrl').append(r.dom());

    r = b('button').classes('key-ctrl jsLeft').append(b('span').classes('icon icon-arrow-left'));
    $('.piano-container .piano-keys').prepend(r.dom());
    r = b('button').classes('key-ctrl jsRight').append(b('span').classes('icon icon-arrow-right'));
    $('.piano-container .piano-keys').append(r.dom());

    r = b('button').classes('piano-ctrl').attr('id','piano-8va-button').append(
      b('span').classes('bold-italic').text('8')).append(
        b('sup').classes('italic').text('va'));
    $('.piano-container .key-left-ctrl').append(r.dom());
    r = b('button').classes('piano-ctrl ').attr('id','piano-8vb-button').append(
      b('span').classes('bold-italic').text('8')).append(
        b('sup').classes('italic').text('vb'));
    $('.piano-container .key-left-ctrl').append(r.dom());
    r = b('button').classes('piano-ctrl jsXposeUp').attr('id','piano-xpose-up').append(
      b('span').classes('bold').text('+'));
    $('.piano-container .key-left-ctrl').append(r.dom());
    r = b('button').classes('piano-ctrl jsXposeDown').attr('id','piano-xpose-down').append(
      b('span').classes('bold').text('-'));
    $('.piano-container .key-left-ctrl').append(r.dom());
    r = b('button').classes('piano-ctrl jsEnharmonic').attr('id','piano-enharmonic').append(
      b('span').classes('bold icon icon-accident'));

    $('.piano-container .key-left-ctrl').append(r.dom());
    r = b('button').classes('piano-ctrl jsChord')
      .append(b('span').classes('icon icon-chords'));
    $('.piano-container .key-left-ctrl').append(r.dom());
	}
	handleResize() {
		this._mapKeys();
	}
  playNote() {
    var pitchSel = JSON.parse(JSON.stringify(this.selections));
    this.tracker.selections.forEach((sel) => {
      var ova = SmoMeasure.defaultPitchForClef[sel.measure.clef];
      pitchSel.forEach((pitch) => {
        pitch.octave = ova.octave + this.octaveOffset;
      });
      SmoUndoable.addPitch(sel, pitchSel, this.undoBuffer);
      suiOscillator.playSelectionNow(sel);
    });
    this.tracker.replaceSelectedMeasures();
  }
	render() {
		$('body').addClass('show-piano');
		var b = svgHelpers.buildSvg;
		var d = suiPiano.dimensions;
		// https://www.mathpages.com/home/kmath043.htm

		// Width of white key at back for C,D,E
		var b1off = d.wwidth - (d.bwidth * 2 / 3);

		// Width of other white keys at the back.
		var b2off=d.wwidth-(d.bwidth*3)/4;

		var keyAr = [];
		var xwhite = [{
				note: 'C',
				x: 0
			}, {
				note: 'D',
				x: d.wwidth
			}, {
				note: 'E',
				x: 2 * d.wwidth
			}, {
				note: 'F',
				x: 3 * d.wwidth
			}, {
				note: 'G',
				x: 4 * d.wwidth
			}, {
				note: 'A',
				x: 5 * d.wwidth
			}, {
				note: 'B',
				x: 6 * d.wwidth
			}
		];
		var xblack = [{
				note: 'Db',
				x: b1off
			}, {
				note: 'Eb',
				x: 2*b1off+d.bwidth
			}, {
				note: 'Gb',
				x: 3*d.wwidth+b2off
			}, {
				note: 'Ab',
				x: (3*d.wwidth+b2off)+b2off+d.bwidth
			}, {
				note: 'Bb',
				x: suiPiano.owidth-(b2off+d.bwidth)
			}
		];
		var wwidth = d.wwidth;
		var bwidth = d.bwidth;
		var wheight = d.wheight;
		var bheight = d.bheight;
		var owidth = suiPiano.wkeysPerOctave * wwidth;

		// Start on C2 to C6 to reduce space
		var octaveOff = 7-d.octaves;

		var x = 0;
		var y = 0;
		var r = b('g');
		for (var i = 0; i < d.octaves; ++i) {
			x = i * owidth;
			xwhite.forEach((key) => {
				var nt = key.note; // + (octaveOff + i + 1).toString();
				var classes = 'piano-key white-key';
				if (nt == 'C4') {
					classes += ' middle-c';
				}
				var rect = b('rect').attr('id', 'keyId-' + nt).rect(x + key.x, y, wwidth, wheight, classes);
				r.append(rect);

				var tt = b('text').text(x + key.x + (wwidth / 5), bheight + 16, 'note-text', nt);
				r.append(tt);
			});
			xblack.forEach((key) => {
				var nt = key.note + (octaveOff + i + 1).toString();
				var classes = 'piano-key black-key';
				var rect = b('rect').attr('id', 'keyId-' + nt).attr('fill','url(#piano-grad)').rect(x + key.x, 0, bwidth, bheight, classes);
				r.append(rect);
			});
		}
		var el = document.getElementById(this.elementId);
    svgHelpers.gradient(el,'piano-grad','vertical',[{color:'#000',offset:'0%'},{color:'#777',offset:'50%'},{color:'#ddd',offset:'100%'}]);
		el.appendChild(r.dom());
		this._renderControls();
		this._mapKeys();
		this.bind();
	}
}
