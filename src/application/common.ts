import { BrowserEventSource } from "./eventSource";
import { SuiScoreViewOperations } from "../render/sui/scoreViewOperations";
import { SuiTracker } from "../render/sui/tracker";

export abstract class ModalComponent {
    abstract closeModalPromise: Promise<void>;
}
export abstract class CompleteNotifier {
    abstract unbindKeyboardForModal(component: ModalComponent): void;
}
export interface DialogParams {
    eventSource: BrowserEventSource,
    view: SuiScoreViewOperations,
    completeNotifier: CompleteNotifier,
    tracker: SuiTracker
}
export interface KeyEvent {
    type: string, shiftKey: boolean, ctrlKey: boolean, altKey: boolean, key: string, keyCode: string,
    code: string, event: string | null
}
export interface KeyBinding {
    event: string,
    key: string,
    ctrlKey: boolean,
    altKey: boolean,
    shiftKey: boolean,
    action: string,
    module?: string
  }