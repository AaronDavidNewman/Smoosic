import { ButtonDefinition } from '../ui/buttons/button';
/**
 * Define the base class for a modal component that resolves a promise when it is dismissed
 * @category SuiUiBase
 */
export abstract class ModalComponent {
  abstract closeModalPromise: Promise<void>;
}
/**
 * Define an interface that gives up event handling when a modal is active
 * @category SuiUiBase
 */
export abstract class CompleteNotifier {
  abstract unbindKeyboardForModal(component: ModalComponent): void;
}
/**
 * @category SuiUiParameter
 */
export interface RibbonLayout {
  left: string[],
  top: string[]
}
/**
 * @category SuiUiParameter
 */
 export interface RibbonDefinition {
  ribbon: RibbonLayout,
  ribbonButtons: ButtonDefinition[]
}

