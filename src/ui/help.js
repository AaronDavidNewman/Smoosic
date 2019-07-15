

class SmoHelp {

    static displayHelp() {
        $('body').addClass('showHelpDialog');
        $('.helpDialog').html('');
        var b = htmlHelpers.buildDom;
        var r = b('div').classes('help-left');
        r.append(SmoHelp.navigationHtml);
        r.append(SmoHelp.noteHelpHtml);
        r.append(SmoHelp.durationHelpHtml);
        $('.helpDialog').append(r.dom());

        r = b('div').classes('help-right');
		r.append(SmoHelp.generalEditHtml);
        r.append(SmoHelp.menuHelpHtml);
        r.append(SmoHelp.dialogHelpHtml);
        $('.helpDialog').append(r.dom());

        $('.helpDialog').append(SmoHelp.closeButton.dom());
        $('.helpDialog button.icon-cross').off('click').on('click', function () {
            $('body').removeClass('showHelpDialog');
            $('body').trigger('dialogDismiss');
        });
    }

    static helpControls() {
        var b = htmlHelpers.buildDom;
        var r = b('button').classes('help-button').append(
                b('span').classes('icon-question helpKey').attr('id', 'globHelp')).append(
                b('label').attr('for', 'globHelp').text('Help'));
        $('body .controls').html('');
        $('body .controls').append(r.dom());
        $('.helpDialog button.icon-cross').focus();
    }

    static modeControls() {
        var b = htmlHelpers.buildDom;
        var r = b('div').classes('menu-status').append(
                b('div').attr('id', 'globMode').text('Next Key Chooses Menu')).append(
                b('div').classes('mode-subtitle').append(SmoHelp.shortMenuHelpHtml));
        $('body .controls').html('');
        $('body .controls').append(r.dom());
    }

    static get closeButton() {
        var b = htmlHelpers.buildDom;
        var r = b('button').classes('icon-cross close');
        return r;
    }

    static _helpButton(buttons) {
        var b = htmlHelpers.buildDom;
        var r = b('span').classes('keyContainer');
        buttons.forEach((button) => {
            button.text = (button.text ? button.text : '');
            button.separator = button.separator ? button.separator : '';
            button.icon = button.icon ? button.icon : '';
            r.append(b('span').classes(button.icon + ' helpKey').text(button.text))
            .append(b('span').classes('separator').text(button.separator));
        });
        return r;
    }

    static _buttonBlock(buttons, text, id) {
        var b = htmlHelpers.buildDom;
        var r = b('div').classes('keyBlock').attr('id', id);
        r.append(SmoHelp._helpButton(buttons)).append(
            b('label').attr('for', id).text(text));
        return r;
    }

    static _buildElements(helps, text) {
        var b = htmlHelpers.buildDom;
        var r = b('div').classes('helpLine').append(
                b('div').classes('help-title').text(text));

        helps.forEach((help) => {
            r.append(SmoHelp._buttonBlock(help.keys, help.text, help.id));
        });
        return r;
    }

    static get navigationElements() {
        return [{
                keys:
                [{
                        icon: 'icon-arrow-right'
                    }, {
                        icon: 'icon-arrow-left'
                    }
                ],
                text: 'Move note selection left or right',
                id: 'navel1'
            }, {
                keys: [{
                        icon: '',
                        text: 'Ctrl',
                        separator: '+'

                    }, {
                        icon: 'icon-arrow-right',
                        separator: ','
                    }, {
                        icon: '',
                        text: 'Ctrl',
                        separator: '+'
                    }, {
                        icon: 'icon-arrow-left'
                    }
                ],
                text: 'Jump selection to next/last measure',
                id: 'navel2'
            }, {
                keys: [{
                        icon: '',
                        text: 'Ctrl',
                        separator: '+'

                    }, {
                        icon: 'icon-arrow-down',
                        separator: ','
                    }, {
                        icon: '',
                        text: 'Ctrl',
                        separator: '+'
                    }, {
                        icon: 'icon-arrow-up'
                    }
                ],
                text: 'Jump selection to staff above/below',
                id: 'navel3'
            }, {
                keys: [{
                        icon: '',
                        text: 'Shift',
                        separator: '+'
                    }, {
                        icon: 'icon-arrow-right',
                        separator: ','
                    }, {
                        icon: '',
                        text: 'Shift',
                        separator: '+'
                    }, {
                        icon: 'icon-arrow-left'
                    }
                ],
                text: 'Grow selection left or right',
                id: 'navel4'
            }, {
                keys: [{
                        icon: '',
                        text: 'Alt',
                        separator: '+'
                    }, {
                        icon: 'icon-arrow-right',
                        separator: ''
                    }
                ],
                text: 'Select note or staff modifier (slur, dynamic)',
                id: 'navel5'
            }
        ];
    }
    static get noteElements() {
        return [{
                keys:
                [{
                        text: 'a'
                    }, {
                        text: '...',
                        icon: 'help-ellipsis'
                    }, {
                        text: 'g'
                    }
                ],
                text: 'Enter letter note A-G at selection',
                id: 'noteElements1'
            }, {
                keys:
                [{
                        text: '-',
                        separator: ','
                    }, {
                        text: '='
                    }
                ],
                text: 'Transpose selected notes down/up 1/2 step',
                id: 'noteElements2'
            }, {
                keys: [{
                        text: 'Ctrl',
                        separator: '+'
                    }, {
                        text: '-',
                        separator: ','
                    }, {
                        text: 'Ctrl',
                        separator: '+'
                    }, {
                        text: '=',
                        separator: ''
                    }
                ],
                text: 'Transpose note up/down octave',
                id: 'noteElements3'
            }, {
                keys: [{
                        text: '2',
                        separator: ''
                    }, {
                        text: '...',
                        icon: 'help-ellipsis'

                    }, {
                        text: '7',
                        separator: ''
                    }
                ],
                text: 'Enter interval 2nd through 7th',
                id: 'noteElements4'
            }, {
                keys: [{
                        text: 'Shift',
                        separator: '+'
                    }, {
                        text: '2',
                        separator: ''
                    }, {
                        text: '...',
                        icon: 'help-ellipsis'

                    }, {
                        text: 'Shift',
                        separator: '+'
                    }, {
                        text: '7'
                    }
                ],
                text: 'Enter interval down 2nd through 7th',
                id: 'noteElements5'
            }, {
                keys: [{
                        text: 'r'
                    }
                ],
                text: 'Toggle note/rest',
                id: 'noteElements6'
            }
        ];
    }
    static get durationElements() {
        return [{
                keys:
                [{
                        text: ',',
                        separator: ','
                    }, {
                        text: '.',
                    }
                ],
                text: 'Double/halve note duration',
                id: 'noteDuration1'
            }, {
                keys:
                [{
                        text: '<',
                        separator: ','
                    }, {
                        text: '>'
                    }
                ],
                text: 'Remove/Add dot to note',
                id: 'noteDuration2'
            }, {
                keys: [{
                        text: 'Ctrl',
                        separator: '+'
                    }, {
                        text: '3',
                    }
                ],
                text: 'Create triplet',
                id: 'noteDuration3'
            }, {
                keys: [{
                        text: 'Ctrl',
                        separator: '+'
                    }, {
                        text: '0',
                    }
                ],
                text: 'Remove triplet',
                id: 'noteDuration4'
            }
        ];
    }
    static get generalEditElements() {
        return [{
                keys:
                [{
                        text: 'Ctrl',
                        separator: '+'
                    }, {
                        text: 'c',
                    }
                ],
                text: 'Copy selection',
                id: 'editElements1'
            }, {
                keys:
                [{
                        text: 'Ctrl',
                        separator: '+'
                    }, {
                        text: 'v'
                    }
                ],
                text: 'Paste copied selection to selection target',
                id: 'editElements2'
            }, {
                keys: [{
                        text: 'Ctrl',
                        separator: '+'
                    }, {
                        text: 'z',
                    }
                ],
                text: 'Undo previous operation',
                id: 'editElements3'
            }, {
                keys: [{
                        text: 'Insert'
                    }
                ],
                text: 'Add measure',
                id: 'editElements4'
            }
        ];
    }
    static get menuModeElements() {
        return [{
                keys:
                [{
                        text: '/',
                        separator: ''
                    }
                ],
                text: 'Next key chooses menu',
                id: 'menuModeElements1'
            }, {
                keys:
                [{
                        text: 'k',
                        separator: ''
                    }
                ],
                text: 'Key signature menu',
                id: 'menuModeElements2'
            }, {
                keys:
                [{
                        text: 'e',
                        separator: ''
                    }
                ],
                text: 'Expression menu (slur, hairpin dynamics)',
                id: 'menuModeElements3'
            }, {
                keys:
                [{
                        text: 'd',
                        separator: ''
                    }
                ],
                text: 'Text dynamics menu',
                id: 'menuModeElements4'
            }, {
                keys:
                [{
                        text: 'Esc',
                        separator: ''
                    }
                ],
                text: 'Cancel slash menu mode',
                id: 'menuModeElements5'
            }
        ];
    }
    static get menuModeShort() {
        return [{
                keys:
                [{
                        text: 'k',
                        separator: ''
                    }
                ],
                text: 'Key signatures',
                id: 'menuModeElements2'
            }, {
                keys:
                [{
                        text: 'e',
                        separator: ''
                    }
                ],
                text: 'Expressions',
                id: 'menuModeElements3'
            }, {
                keys:
                [{
                        text: 'd',
                        separator: ''
                    }
                ],
                text: 'Dynamics',
                id: 'menuModeElements4'
            }, {
                keys:
                [{
                        text: 'Esc',
                        separator: ''
                    }
                ],
                text: 'Continue Editing',
                id: 'menuModeElements5'
            }
        ];
    }
    static get dialogElements() {
        return [{
                keys:
                [{
                        text: 'p',
                        separator: ''
                    }
                ],
                text: 'Property dialog for selected modifier (see Score Navigation)',
                id: 'menuModeElements1'
            }
        ];
    }

    static get navigationHtml() {
        return SmoHelp._buildElements(SmoHelp.navigationElements, 'Score Navigation');
    }
    static get noteHelpHtml() {
        return SmoHelp._buildElements(SmoHelp.noteElements, 'Note Entry');
    }
    static get durationHelpHtml() {
        return SmoHelp._buildElements(SmoHelp.durationElements, 'Note Duration');
    }
    static get menuHelpHtml() {
        return SmoHelp._buildElements(SmoHelp.menuModeElements, 'Menus');
    }
    static get generalEditHtml() {
        return SmoHelp._buildElements(SmoHelp.generalEditElements, 'Editing');
    }
    static get shortMenuHelpHtml() {
        return SmoHelp._buildElements(SmoHelp.menuModeShort, 'Menus');
    }
    static get dialogHelpHtml() {
        return SmoHelp._buildElements(SmoHelp.dialogElements, 'Property Dialogs');
    }
}
