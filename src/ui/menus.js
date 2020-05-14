
class suiMenuBase {
	constructor(params) {
		Vex.Merge(this, params);
        this.focusIndex = -1;
	}

	complete() {
		$('body').trigger('menuDismiss');
	}
}

class suiMenuManager {
	constructor(params) {
		Vex.Merge(this, suiMenuManager.defaults);
		Vex.Merge(this, params);
		this.bound = false;
        this.hotkeyBindings={};
	}

	static get defaults() {
		return {
			menuBind: suiMenuManager.menuKeyBindingDefaults,
			menuContainer: '.menuContainer'
		};
	}

    setController(c) {
        this.controller=c;
    }

    get score() {
        return this.layout.score;
    }

	// ### Description:
	// slash ('/') menu key bindings.  The slash key followed by another key brings up
	// a menu.
	static get menuKeyBindingDefaults() {
		return [{
				event: "keydown",
				key: "k",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "suiKeySignatureMenu"
			}, {
				event: "keydown",
				key: "l",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "suiStaffModifierMenu"
			}, {
				event: "keydown",
				key: "d",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "SuiDynamicsMenu"
			}, {
				event: "keydown",
				key: "s",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "SuiAddStaffMenu"
			}, {
				event: "keydown",
				key: "f",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "SuiFileMenu"
			},
			 {
				event: "keydown",
				key: "m",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "SuiTimeSignatureMenu"
			}

		];
	}
  _advanceSelection(inc) {
      var options = $('.menuContainer ul.menuElement li.menuOption');
      inc = inc < 0 ? options.length - 1: 1;
      this.menu.focusIndex = (this.menu.focusIndex+inc) % options.length;
      $(options[this.menu.focusIndex]).find('button').focus();
  }

	get menuBindings() {
		return this.menuBind;
	}

	unattach() {
		window.removeEventListener("keydown", this.keydownHandler, true);
		$('body').removeClass('modal');
		$(this.menuContainer).html('');
		$('body').off('dismissMenu');
		this.bound = false;
	}

	attach(el) {
		var b = htmlHelpers.buildDom();

		$(this.menuContainer).html('');
		$(this.menuContainer).attr('z-index', '12');
		var b = htmlHelpers.buildDom;
		var r = b('ul').classes('menuElement').attr('size', this.menu.menuItems.length)
			.css('left', '' + this.menuPosition.x + 'px')
			.css('top', '' + this.menuPosition.y + 'px');
        var hotkey=0;
		this.menu.menuItems.forEach((item) => {
            var vkey = (hotkey < 10) ? String.fromCharCode(48+hotkey) :
                 String.fromCharCode(87 + hotkey) ;

		r.append(
			b('li').classes('menuOption').append(
				b('button').attr('data-value',item.value)
                  .append(b('span').classes('menuText').text(item.text))

				.append(
					b('span').classes('icon icon-' + item.icon))
                   .append(b('span').classes('menu-key').text(''+vkey))));
          item.hotkey=vkey;
          hotkey += 1;
		});
		$(this.menuContainer).append(r.dom());
		$('body').addClass('modal');
		this.bindEvents();
	}
	slashMenuMode(completeNotifier) {
		var self = this;
		this.bindEvents();
    layoutDebug.addDialogDebug('slash menu creating closeMenuPromise');
		this.closeMenuPromise = new Promise((resolve, reject) => {
				$('body').off('menuDismiss').on('menuDismiss', function () {
          layoutDebug.addDialogDebug('menuDismiss received, resolve closeMenuPromise');
					self.unattach();
          $('body').removeClass('slash-menu');
					resolve();
				});

			});
   // take over the keyboard
    completeNotifier.unbindKeyboardForMenu(this);
	}

	createMenu(action,completeNotifier) {
		this.menuPosition = {x:250,y:40,width:1,height:1};
    // If we were called from the ribbon, we notify the controller that we are
    // taking over the keyboard.  If this was a key-based command we already did.

    layoutDebug.addDialogDebug('createMenu creating ' + action);
		var ctor = eval(action);
		this.menu = new ctor({
				position: this.menuPosition,
				tracker: this.tracker,
				editor: this.editor,
				score: this.score,
        controller:this.controller,
        closePromise:this.closeMenuPromise,
        layout: this.layout
			});
		this.attach(this.menuContainer);
        this.menu.menuItems.forEach((item) => {
            if (typeof(item.hotkey) != 'undefined') {
                this.hotkeyBindings[item.hotkey] = item.value;
            }
        });
	}

	handleKeydown(event) {
		console.log("KeyboardEvent: key='" + event.key + "' | code='" +
			event.code + "'"
			 + " shift='" + event.shiftKey + "' control='" + event.ctrlKey + "'" + " alt='" + event.altKey + "'");
		if (['Tab', 'Enter'].indexOf(event.code) >= 0) {
			return;
		}

		event.preventDefault();

		if (event.code === 'Escape') {
			$('body').trigger('menuDismiss');
		}
		if (this.menu) {
            if (event.code == 'ArrowUp') {
                this._advanceSelection(-1);
            }
            else if (event.code == 'ArrowDown') {
                this._advanceSelection(1);
            } else  if (this.hotkeyBindings[event.key]) {
                $('button[data-value="'+this.hotkeyBindings[event.key]+'"]').click();
            } else {
			    this.menu.keydown(event);
            }
		}
		if (this.tracker.selections.length == 0) {
			this.unattach();
			return;
		}

		var binding = this.menuBind.find((ev) => {
				return ev.key === event.key
			});
		if (!binding) {
			return;
		}
		this.createMenu(binding.action);
	}

	bindEvents() {
		var self = this;
        this.hotkeyBindings={};
        $('body').addClass('slash-menu');

		if (!this.bound) {
			this.keydownHandler = this.handleKeydown.bind(this);

			window.addEventListener("keydown", this.keydownHandler, true);
			this.bound = true;
		}
		$(this.menuContainer).find('button').off('click').on('click', function (ev) {
			if ($(ev.currentTarget).attr('data-value') == 'cancel') {
				self.menu.complete();
				return;
			}
			self.menu.selection(ev);
		});
	}
}



class SuiFileMenu extends suiMenuBase {
    constructor(params) {
		params = (params ? params : {});
		Vex.Merge(params, SuiFileMenu.defaults);
    super(params);
    this.tracker = this.controller.tracker;
	}
 static get defaults() {
		return {
			menuItems: [{
					icon: 'folder-new',
					text: 'New Score',
					value: 'newFile'
				},{
					icon: 'folder-open',
					text: 'Open',
					value: 'openFile'
				},{
					icon: 'folder-save',
					text: 'Save',
					value: 'saveFile'
				},{
					icon: 'folder-save',
					text: 'Quick Save',
					value: 'quickSave'
				},{
					icon: '',
					text: 'Print',
					value: 'printScore'
        },{
					icon: '',
					text: 'Bach Invention',
					value: 'bach'
        },{
					icon: '',
					text: 'Jesu Bambino',
					value: 'bambino'
        },{
					icon: '',
					text: 'Microtone Sample',
					value: 'microtone'
        },{
					icon: '',
					text: 'Precious Lord',
					value: 'preciousLord'
        },	{
					icon: '',
					text: 'Cancel',
					value: 'cancel'
				}
      ]
    };
  }

  printRenderPromise() {
     $('body').addClass('print-render');
     $('.printFrame').html('');
     var layout = this.layout;
     var tracker = this.tracker;
     layout.setRefresh();
     var promise = new Promise((resolve) => {
         var poll = () => {


        setTimeout(() => {
            if (!layout.dirty) {
                tracker.highlightSelection();
                $('body').removeClass('print-render');
                $('body').addClass('printing');
                resolve();
            }else {
                poll();
            }
        },500);
        }
        poll();
     });
     return promise;
  }

  systemPrint() {
     var self = this;
     var svgDoc = $('#boo svg')[0];
     var s = new XMLSerializer();
     var svgString = s.serializeToString(svgDoc);
     var iframe = document.createElement("iframe");
     var scale = 1.0/this.layout.score.layout.zoomScale;
     var w=Math.round(scale * $('#boo').width());
     var h=Math.round(scale * $('#boo').height());
     $(iframe).attr('width',w);
     $(iframe).attr('height',h);
     iframe.srcdoc=svgString;
     $('.printFrame')[0].appendChild(iframe);
     $('.printFrame').width(w);
     $('.printFrame').height(h);
     function resize() {
         setTimeout(function() {
             var svg = $(window.frames[0].document.getElementsByTagName('svg'));
             if (svg && svg.length) {
                 $(window.frames[0].document.getElementsByTagName('svg')).height(h);
                 $(window.frames[0].document.getElementsByTagName('svg')).width(w);
                 window.print();
                 SuiPrintFileDialog.createAndDisplay({
                     layout: self.layout,
                     controller:self.controller,
                     closeMenuPromise:self.closePromise,
                     tracker:self.tracker
                     });
             } else {
                 resize();
             }
         },500);
     }
    resize();
  }
  selection(ev) {
  var text = $(ev.currentTarget).attr('data-value');
  var self=this;
  if (text == 'saveFile') {
    SuiSaveFileDialog.createAndDisplay({
		  layout: this.layout,
      controller:this.controller,
      closeMenuPromise:this.closePromise
		});
    } else if (text == 'openFile') {
      SuiLoadFileDialog.createAndDisplay({
			layout: this.layout,
      controller:this.controller,
      closeMenuPromise:this.closePromise
		   });
     } else if (text == 'newFile') {
        this.controller.undoBuffer.addBuffer('New Score', 'score', null, this.layout.score);
        var score = SmoScore.getDefaultScore();
        this.layout.score = score;
        setTimeout(function() {
        $('body').trigger('forceResizeEvent');
        },1);

      } else if (text == 'quickSave') {
        var scoreStr = JSON.stringify(this.layout.score.serialize());
        localStorage.setItem(smoSerialize.localScore,scoreStr);
      } else if (text == 'printScore') {
        var systemPrint = () => {
        self.systemPrint();
      }
        this.printRenderPromise().then(systemPrint);
      } else if (text == 'bach') {
  			this.controller.undoBuffer.addBuffer('New Score', 'score', null, this.layout.score);
  			var score = SmoScore.deserialize(inventionJson);
  			this.layout.score = score;
  			this.layout.setViewport(true);
		  }
      else if (text == 'bambino') {
        this.controller.undoBuffer.addBuffer('New Score', 'score', null, this.layout.score);
        var score = SmoScore.deserialize(jesuBambino);
        this.layout.score = score;
        this.layout.setViewport(true);
      } else if (text == 'microtone') {
        this.controller.undoBuffer.addBuffer('New Score', 'score', null, this.layout.score);
        var score = SmoScore.deserialize(microJson);
        this.layout.score = score;
        this.layout.setViewport(true);
      }     else if (text == 'preciousLord') {
        this.controller.undoBuffer.addBuffer('New Score', 'score', null, this.layout.score);
        var score = SmoScore.deserialize(preciousLord);
        this.layout.score = score;
        this.layout.setViewport(true);
    }
		this.complete();
	}

	keydown(ev) {}
}

class SuiDynamicsMenu extends suiMenuBase {
	constructor(params) {
	params = (params ? params : {});
	Vex.Merge(params, SuiDynamicsMenu.defaults);
	super(params);
	}
	static get defaults() {
		return {
			menuItems: [{
					icon: 'pianissimo',
					text: 'Pianissimo',
					value: 'pp'
				}, {
					icon: 'piano',
					text: 'Piano',
					value: 'p'
				}, {
					icon: 'mezzopiano',
					text: 'Mezzo-piano',
					value: 'mp'
				}, {
					icon: 'mezzoforte',
					text: 'Mezzo-forte',
					value: 'mf'
				}, {
					icon: 'forte',
					text: 'Forte',
					value: 'f'
				}, {
					icon: 'fortissimo',
					text: 'Fortissimo',
					value: 'ff'
				}, {
					icon: 'sfz',
					text: 'sfortzando',
					value: 'sfz'
				},
				 {
					icon: '',
					text: 'Cancel',
					value: 'cancel'
				}
			]
		};
	}

	selection(ev) {
		var text = $(ev.currentTarget).attr('data-value');

		var ft = this.tracker.getExtremeSelection(-1);
		if (!ft || !ft.note) {
			return;
		}

		SmoUndoable.addDynamic(ft, new SmoDynamicText({
				selector: ft.selector,
				text: text,
				yOffsetLine: 11,
				fontSize: 38
			}), this.editor.undoBuffer);
    this.tracker.replaceSelectedMeasures();
		this.complete();
	}
	keydown(ev) {}
}

class SuiTimeSignatureMenu extends suiMenuBase {
    constructor(params) {
		params = (params ? params : {});
		Vex.Merge(params, SuiTimeSignatureMenu.defaults);
		super(params);
	}
    static get defaults() {
		return {
			menuItems: [{
					icon: 'sixeight',
					text: '6/8',
					value: '6/8',
				},{
					icon: 'threefour',
					text: '3/4',
					value: '3/4',
				},{
					icon: 'twofour',
					text: '2/4',
					value: '2/4',
				},{
					icon: 'twelveeight',
					text: '12/8',
					value: '12/8',
				},{
					icon: 'seveneight',
					text: '7/8',
					value: '7/8',
				},{
					icon: 'fiveeight',
					text: '5/8',
					value: '5/8',
				},{
					icon: '',
					text: 'Other',
					value: 'Other',
				},{
					icon: '',
					text: 'Cancel',
					value: 'cancel'
				}
                ]
        };
    }

    selection(ev) {
      var text = $(ev.currentTarget).attr('data-value');

      if (text == 'Other') {
              SuiTimeSignatureDialog.createAndDisplay({
  			layout: this.layout,
              controller:this.controller,
              closeMenuPromise:this.closePromise
  		    });
      this.complete();
      return;
    }
		var timeSig = $(ev.currentTarget).attr('data-value');
    this.layout.unrenderAll();
    SmoUndoable.scoreSelectionOp(this.layout.score,this.tracker.selections,
      'setTimeSignature',timeSig,this.controller.undoBuffer,'change time signature');
    this.layout.setRefresh();
		this.complete();
	}
	keydown(ev) {}
}
class suiKeySignatureMenu extends suiMenuBase {

	constructor(params) {
		params = (params ? params : {});
		Vex.Merge(params, suiKeySignatureMenu.defaults);
		super(params);
	}
	static get defaults() {
		return {
			menuItems: [{
					icon: 'key-sig-c',
					text: 'C Major',
					value: 'C',
				}, {
					icon: 'key-sig-f',
					text: 'F Major',
					value: 'F',
				}, {
					icon: 'key-sig-g',
					text: 'G Major',
					value: 'G',
				}, {
					icon: 'key-sig-bb',
					text: 'Bb Major',
					value: 'Bb'
				}, {
					icon: 'key-sig-d',
					text: 'D Major',
					value: 'D'
				}, {
					icon: 'key-sig-eb',
					text: 'Eb Major',
					value: 'Eb'
				}, {
					icon: 'key-sig-a',
					text: 'A Major',
					value: 'A'
				}, {
					icon: 'key-sig-ab',
					text: 'Ab Major',
					value: 'Ab'
				}, {
					icon: 'key-sig-e',
					text: 'E Major',
					value: 'E'
				}, {
					icon: 'key-sig-bd',
					text: 'Db Major',
					value: 'Db'
				}, {
					icon: 'key-sig-b',
					text: 'B Major',
					value: 'B'
				}, {
					icon: 'key-sig-fs',
					text: 'F# Major',
					value: 'F#'
				}, {
					icon: 'key-sig-cs',
					text: 'C# Major',
					value: 'C#'
				},
				 {
					icon: '',
					text: 'Cancel',
					value: 'cancel'
				}
			],
			menuContainer: '.menuContainer'
		};
	}

	selection(ev) {
		var keySig = $(ev.currentTarget).attr('data-value');
		var changed = [];
		this.tracker.selections.forEach((sel) => {
			if (changed.indexOf(sel.selector.measure) === -1) {
				changed.push(sel.selector.measure);
				SmoUndoable.addKeySignature(this.score, sel, keySig, this.editor.undoBuffer);
        this.tracker.replaceSelectedMeasures();
			}
		});
		this.complete();
	}
	keydown(ev) {}
}

class suiStaffModifierMenu extends suiMenuBase {

	constructor(params) {
		params = (params ? params : {});
		Vex.Merge(params, suiStaffModifierMenu.defaults);
		super(params);
	}
	static get defaults() {
		return {
			menuItems: [{
					icon: 'cresc',
					text: 'Crescendo',
					value: 'crescendo'
				}, {
					icon: 'decresc',
					text: 'Decrescendo',
					value: 'decrescendo'
				}, {
					icon: 'slur',
					text: 'Slur/Tie',
					value: 'slur'
				}, {
					icon: 'ending',
					text: 'nth ending',
					value: 'ending'
				},
				 {
					icon: '',
					text: 'Cancel',
					value: 'cancel'
				}
			],
			menuContainer: '.menuContainer'
		};
	}
	selection(ev) {
		var op = $(ev.currentTarget).attr('data-value');

		var ft = this.tracker.getExtremeSelection(-1);
		var tt = this.tracker.getExtremeSelection(1);

		if (op === 'ending') {
           SmoUndoable.scoreOp(this.score,'addEnding',
		       new SmoVolta({startBar:ft.selector.measure,endBar:tt.selector.measure,number:1}),this.editor.undoBuffer,'add ending');
		    this.complete();
			return;
		}
		if (SmoSelector.sameNote(ft.selector, tt.selector)) {
			this.complete();
			return;
		}

		SmoUndoable[op](ft, tt, this.editor.undoBuffer);
    this.tracker.replaceSelectedMeasures();
		this.complete();
	}
	keydown(ev) {}
}

class SuiAddStaffMenu extends suiMenuBase {
	constructor(params) {
		params = (params ? params : {});
		Vex.Merge(params, SuiAddStaffMenu.defaults);
		super(params);
	}
	static get defaults() {
		return {
			menuItems: [{
					icon: 'treble',
					text: 'Treble Clef Staff',
					value: 'trebleInstrument'
				}, {
					icon: 'bass',
					text: 'Bass Clef Staff',
					value: 'bassInstrument'
				}, {
					icon: 'alto',
					text: 'Alto Clef Staff',
					value: 'altoInstrument'
				}, {
					icon: 'tenor',
					text: 'Tenor Clef Staff',
					value: 'tenorInstrument'
				}, {
					icon: 'cancel-circle',
					text: 'Remove Staff',
					value: 'remove'
				},
				 {
					icon: '',
					text: 'Cancel',
					value: 'cancel'
				}
			],
			menuContainer: '.menuContainer'
		};
	}
	static get instrumentMap() {
		return {
			'trebleInstrument': {
				instrumentInfo: {
					instrumentName: 'Treble Clef Staff',
					keyOffset: 0,
					clef: 'treble'
				}
			},
			'bassInstrument': {
				instrumentInfo: {
					instrumentName: 'Bass Clef Staff',
					keyOffset: 0,
					clef: 'bass'
				}
			},
			'altoInstrument': {
				instrumentInfo: {
					instrumentName: 'Alto Clef Staff',
					keyOffset: 0,
					clef: 'alto'
				}
			},
			'tenorInstrument': {
				instrumentInfo: {
					instrumentName: 'Tenor Clef Staff',
					keyOffset: 0,
					clef: 'tenor'
				}
			},
			'remove': {
				instrumentInfo: {
					instrumentName: 'Remove clef',
					keyOffset: 0,
					clef: 'tenor'
				}
			}
		}

	}
	selection(ev) {
		var op = $(ev.currentTarget).attr('data-value');
		if (op == 'remove') {
			if (this.score.staves.length > 1 && this.tracker.selections.length > 0) {
				this.tracker.layout.unrenderAll();
				SmoUndoable.removeStaff(this.score, this.tracker.selections[0].selector.staff, this.editor.undoBuffer);
				this.tracker.layout.setRefresh();
			}

		} else if (op === 'cancel') {
			this.complete();
		}else {
			var instrument = SuiAddStaffMenu.instrumentMap[op];
			SmoUndoable.addStaff(this.score, instrument, this.editor.undoBuffer);
			this.tracker.layout.setRefresh();
		}
    this.layout.setRefresh();
		this.complete();
	}
	keydown(ev) {}

}
