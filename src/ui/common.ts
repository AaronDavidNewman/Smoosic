import { ButtonDefinition } from '../ui/buttons/button';
export abstract class ModalComponent {
  abstract closeModalPromise: Promise<void>;
}
export abstract class CompleteNotifier {
  abstract unbindKeyboardForModal(component: ModalComponent): void;
}
export interface RibbonLayout {
  left: string[],
  top: string[]
}
export interface RibbonDefinition {
  ribbon: RibbonLayout,
  ribbonButtons: ButtonDefinition[]
}

