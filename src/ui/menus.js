
class suiMenuBase {
    constructor(params) {
        Vex.Merge(this, params);
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
    }

    static get defaults() {
        return {
            menuBind: suiMenuManager.menuKeyBindingDefaults,
            menuContainer: '.menuContainer'
        };
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
                key: "e",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "suiStaffModifierMenu"
            },
			{
                event: "keydown",
                key: "d",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "SuiDynamicsMenu"
            }
        ];
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
            .css('top', '' + this.menuPosition.y + 'px')
            .css('height', '' + this.menu.menuItems.length * 35 + 'px');
        this.menu.menuItems.forEach((item) => {
            r.append(
                b('li').classes('menuOption').append(
                    b('button')
                    .text(item.text).attr('data-value', item.value)
                    .append(
                        b('span').classes('icon icon-' + item.icon))));
        });
        $(this.menuContainer).append(r.dom());
        $('body').addClass('modal');
        this.bindEvents();
    }
    slashMenuMode() {
        var self = this;
        this.bindEvents();
        this.closeMenuPromise = new Promise((resolve, reject) => {
                $('body').off('menuDismiss').on('menuDismiss', function () {
                    self.unattach();
                    resolve();
                });

            });
        return this.closeMenuPromise;
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
            this.menu.keydown(event);
        }
        if (this.tracker.selections.length == 0) {
            this.toggleMenuMode();
            return;
        }
        this.menuPosition = this.tracker.selections[0].box;
        var binding = this.menuBind.find((ev) => {
                return ev.key === event.key
            });
        if (!binding) {
            return;
        }
        var ctor = eval(binding.action);
        this.menu = new ctor({
                position: this.menuPosition,
                tracker: this.tracker,
                editor: this.editor,
                score: this.score
            });
        this.attach(this.menuContainer);
    }

    bindEvents() {
        var self = this;

        if (!this.bound) {
            this.keydownHandler = this.handleKeydown.bind(this);

            window.addEventListener("keydown", this.keydownHandler, true);
            this.bound = true;
        }
        $(this.menuContainer).find('button').off('click').on('click', function (ev) {
            self.menu.selection(ev);
        });
    }
}

class SuiDynamicsMenu extends suiMenuBase {
	 constructor(params) {
        params = (params ? params : {});
        Vex.Merge(params, SuiDynamicsMenu.defaults);
        super(params);
    }
	static get defaults() {
		return {menuItems: [ 
		{icon: 'pianissimo',
                    text: 'Pianissimo',
                    value: 'pp'
                },
		{icon: 'piano',
                    text: 'Piano',
                    value: 'p'
                },
		{icon: 'mezzopiano',
                    text: 'Mezzo-piano',
                    value: 'mp'
                },
		{icon: 'mezzoforte',
                    text: 'Mezzo-forte',
                    value: 'mf'
        },
		{icon: 'forte',
                    text: 'Forte',
                    value: 'f'
        },
		{icon: 'fortissimo',
                    text: 'Fortissimo',
                    value: 'ff'
        },
		{icon: 'sfz',
                    text: 'sfortzando',
                    value: 'sfz'
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

        SmoUndoable.addDynamic(ft,new SmoDynamicText({selector:ft.selector,text:text,yOffsetLine:11,fontSize:38}),this.editor.undoBuffer);
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
                    value: 'C'
                }, {
                    icon: 'key-sig-f',
                    text: 'F Major',
                    value: 'F'
                }, {
                    icon: 'key-sig-g',
                    text: 'G Major',
                    value: 'G'
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
				SmoUndoable.addKeySignature(this.score,sel,keySig,this.editor.undoBuffer);
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
                }
            ],
            menuContainer: '.menuContainer'
        };
    }
    selection(ev) {
        var op = $(ev.currentTarget).attr('data-value');

        var ft = this.tracker.getExtremeSelection(-1);
        var tt = this.tracker.getExtremeSelection(1);
        if (SmoSelector.sameNote(ft.selector, tt.selector)) {
            this.complete();
            return;
        }

        SmoUndoable[op](ft, tt,this.editor.undoBuffer);
        this.complete();
    }
    keydown(ev) {}
}
