
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
    }

    static get menuKeyBindingDefaults() {
        return [{
                event: "keydown",
                key: "k",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "suiKeySignatureMenu"
            }
        ];
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
            }
        ];
    }

    unattach() {
        window.removeEventListener("keydown", this.keydownHandler, true);
        $('body').removeClass('modal');
        $(this.menuContainer).html('');
        $('body').off('dismissMenu');
    }

    attach(el) {
		var b = htmlHelpers.buildDom();
		
        $(this.menuContainer).html('');
        $(this.menuContainer).attr('z-index', '12');
		var b = htmlHelpers.buildDom;
		var r=b('ul').classes('menuElement').attr('size', this.menu.menuItems.length)
		    .css('left', '' + this.menuPosition.x + 'px')
		    .css('top', '' + this.menuPosition.y + 'px')
			.css('height', '' + this.menu.menuItems.length * 35 + 'px');
        // $(ul).addClass('menuElement');
        this.menu.menuItems.forEach((item) => {
			r.append(
			   b('li').classes('menuOption').append(
			      b('button')
			       .text(item.text).attr('data-value',item.value)
				   .append(
				     b('span').classes('icon icon-' + item.icon)
					 )
				   )
				 );
        });
        /* $(ul).css('left', '' + this.menuPosition.x + 'px');
        $(ul).css('top', '' + this.menuPosition.y + 'px');
        $(ul).css('height', '' + this.menu.menuItems.length * 35 + 'px'); */
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
        this.keydownHandler = this.handleKeydown.bind(this);

        window.addEventListener("keydown", this.keydownHandler, true);

        $(this.menuContainer).find('button').off('click').on('click', function (ev) {
            self.menu.selection(ev);
        });
    }
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
        var self = this;
        this.tracker.iterateMeasures((measure) => {
            this.score.addKeySignature(measure.measureNumber.measureIndex, keySig);
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
                }
            ], 
            menuContainer: '.menuContainer'
        };
    }
    selection(ev) {
        var op = $(ev.currentTarget).attr('data-value');

        var self = this;
        var ft = this.tracker.getExtremeSelection(-1);
        var tt = this.tracker.getExtremeSelection(1);
		if (SmoSelector.sameNote(ft.selector,tt.selector)) {
			this.complete();
			return;
		}

        SmoOperation[op](ft, tt);
        this.complete();
    }
    keydown(ev) {}
}

class SuiAttributeDialog {
	
}
