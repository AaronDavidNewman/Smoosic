
class suiPiano {
	constructor(parameters) {
		this.elementId = parameters.elementId;
		this.renderElement = document.getElementById('piano-svg')
			this.selections = [];
		this.render();
	}

	static get dimensions() {
		return {
			wwidth: 23,
			bwidth: 13,
			wheight: 120,
			bheight: 80,
			octaves:5
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
		$('body').toggleClass('show-piano');
		// handle resize work area.
		window.dispatchEvent(new Event('resize'));
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
		$(this.renderElement).off('mousemove').on('mousemove', function (ev) {
			var keyPressed = svgHelpers.findSmallestIntersection({
					x: ev.clientX,
					y: ev.clientY
				}, self.objects);
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
			window.dispatchEvent(new Event('resize'));
		});
	}
	_updateSelections(ev) {
		var keyPressed = svgHelpers.findSmallestIntersection({
				x: ev.clientX,
				y: ev.clientY
			}, this.objects);
		if (!keyPressed) {
			return;
		}
		if (!ev.shiftKey) {
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
		$('body').trigger('smo-piano-key', {
			selections: JSON.parse(JSON.stringify(this.selections))
		});
	}
	_renderclose() {
		var b = htmlHelpers.buildDom;
		var r = b('button').classes('icon icon-cross close close-piano');
		$(this.renderElement).closest('div').append(r.dom());
	}
	handleResize() {
		this._updateOffsets();
		this._mapKeys();
	}
	_updateOffsets() {
		var padding = Math.round(window.innerWidth - suiPiano.owidth*suiPiano.dimensions.octaves)/2;
		$(this.renderElement).closest('div').css('margin-left',''+padding+'px');
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
				var nt = key.note + (octaveOff + i + 1).toString();
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
				var rect = b('rect').attr('id', 'keyId-' + nt).rect(x + key.x, 0, bwidth, bheight, classes);
				r.append(rect);
			});
		}
		var el = document.getElementById(this.elementId);
		el.appendChild(r.dom());
		this._renderclose();
		this._updateOffsets();
		this._mapKeys();
		this.bind();
	}
}
