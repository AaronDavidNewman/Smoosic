import { MenuDefinition, SuiMenuBase, SuiMenuParams } from './menu';
import {
    SuiScoreViewDialog, SuiGlobalLayoutDialog, SuiScoreIdentificationDialog,
    SuiScoreFontDialog, SuiLayoutDialog
} from '../dialogs/scoreDialogs';

declare var $: any;
export class SuiScoreMenu extends SuiMenuBase {
    static get defaults(): MenuDefinition {
        return {
            label: 'Score Settings',
            menuItems: [{
                icon: '',
                text: 'Layout',
                value: 'layout'
            }, {
                icon: '',
                text: 'Fonts',
                value: 'fonts'
            }, {
                icon: '',
                text: 'View',
                value: 'view'
            }, {
                icon: '',
                text: 'Score Info',
                value: 'identification'
            }, {
                icon: '',
                text: 'Global Settings',
                value: 'preferences'
            }, {
                icon: '',
                text: 'Cancel',
                value: 'cancel'
            }]
        };
    }
    getDefinition() {
        return SuiScoreMenu.defaults;
    }
    constructor(params: SuiMenuParams) {
        super(params);
    }

    execView() {
        SuiScoreViewDialog.createAndDisplay(
            {
                eventSource: this.eventSource,
                completeNotifier: this.completeNotifier,
                view: this.view,
                startPromise: this.closePromise
            });
    }
    execScoreId() {
        SuiScoreIdentificationDialog.createAndDisplay(
            {
                eventSource: this.eventSource,
                completeNotifier: this.completeNotifier,
                view: this.view,
                startPromise: this.closePromise
            });
    }
    execLayout() {
        SuiLayoutDialog.createAndDisplay(
            {
                eventSource: this.eventSource,
                completeNotifier: this.completeNotifier,
                view: this.view,
                startPromise: this.closePromise
            });
    }
    execFonts() {
        SuiScoreFontDialog.createAndDisplay(
            {
                eventSource: this.eventSource,
                completeNotifier: this.completeNotifier,
                view: this.view,
                startPromise: this.closePromise
            });
    }
    execPreferences() {
        SuiGlobalLayoutDialog.createAndDisplay(
            {
                eventSource: this.eventSource,
                completeNotifier: this.completeNotifier,
                view: this.view,
                startPromise: this.closePromise
            });
    }
    selection(ev: any) {
        const text = $(ev.currentTarget).attr('data-value');
        if (text === 'view') {
            this.execView();
        } else if (text === 'layout') {
            this.execLayout();
        } else if (text === 'fonts') {
            this.execFonts();
        } else if (text === 'preferences') {
            this.execPreferences();
        } else if (text === 'identification') {
            this.execScoreId();
        }
        this.complete();
    }
    keydown() { }
}