import { BrowserEventSource } from "./eventSource";
import { SuiScoreViewOperations } from "../render/sui/scoreViewOperations";
import { SuiTracker } from "../render/sui/tracker";

export abstract class ModalComponent {
    abstract closeModalPromise: Promise<any>;
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