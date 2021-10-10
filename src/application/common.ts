import { SuiScoreViewOperations } from "../render/sui/scoreViewOperations";
import { SuiTracker } from "../render/sui/tracker";
import { BrowserEventSource } from "./eventSource";
export abstract class ModalComponent {
    abstract closeModalPromise: Promise<void>;
}
export abstract class CompleteNotifier {
    abstract unbindKeyboardForModal(component: ModalComponent): void;
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
export interface KeyCommandParams {
  view: SuiScoreViewOperations;
  slashMode: boolean;
  completeNotifier: CompleteNotifier;
  tracker: SuiTracker;
  eventSource: BrowserEventSource;
}