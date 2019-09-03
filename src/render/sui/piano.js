
class suiPiano {
	constructor(parameters) {
		this.elementId = parameters.elementId;
		this.renderElement = document.getElementById('piano-svg')
		this.selections=[];
		this.render();
	}
	
	static createAndDisplay(parms) {
		$('body').toggleClass('show-piano');
	}
	_mapKeys() {
		this.objects = [];
		var keys = [].slice.call(this.renderElement.getElementsByClassName('piano-key'));
		keys.forEach((key) => {
			var rect = key.getBoundingClientRect();
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

		});
		$(this.renderElement).off('click').on('click', function (ev) {
			self._updateSelections(ev);
		});
		
		$('.close-piano').off('click').on('click',function() {
			$('body').removeClass('show-piano');
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
		$('body').trigger('smo-piano-key', {selections:JSON.parse(JSON.stringify(this.selections))});
	}
	_renderclose() {
		var b = htmlHelpers.buildDom;
		var r = b('button').classes('icon icon-cross close close-piano');
		$(this.renderElement).closest('div').append(r.dom());
	}
	render() {
		$('body').addClass('show-piano');
		var b = svgHelpers.buildSvg;
		var keyAr = [];
		var xwhite = [{
				note: 'C',
				x: 0
			}, {
				note: 'D',
				x: 23
			}, {
				note: 'E',
				x: 46
			}, {
				note: 'F',
				x: 69
			}, {
				note: 'G',
				x: 92
			}, {
				note: 'A',
				x: 115
			}, {
				note: 'B',
				x: 138
			}
		];
		var xblack = [{
				note: 'Db',
				x: 14.333
			}, {
				note: 'Eb',
				x: 41.6666
			}, {
				note: 'Gb',
				x: 82.25
			}, {
				note: 'Ab',
				x: 108.25
			}, {
				note: 'Bb',
				x: 134.75
			}
		];
		var wwidth = 23;
		var bwidth = 13;
		var wheight = 120;
		var bheight = 80;
		var owidth = 7 * 23;
		var x = 0;
		var y = 0;
		var r = b('g');
		for (var i = 0; i < 7; ++i) {
			x = i * owidth;
			xwhite.forEach((key) => {
				var nt = key.note + (i + 1).toString();
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
				var nt = key.note + (i + 1).toString();
				var classes = 'piano-key black-key';
				var rect = b('rect').attr('id', 'keyId-' + nt).rect(x + key.x, 0, bwidth, bheight, classes);
				r.append(rect);
			});
		}
		var el = document.getElementById(this.elementId);
		el.appendChild(r.dom());
		this._renderclose();
		this._mapKeys();
		this.bind();
	}
}
