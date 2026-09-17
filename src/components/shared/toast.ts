import { toast } from 'sonner';

type ToastAction = { label: string; onClick: () => void };

/** Auto-dismisses after 4s, per COMPONENTS.md "Feedback". */
export function showSuccessToast(title: string, description?: string, action?: ToastAction) {
  toast.success(title, {
    description,
    duration: 4000,
    action: action && { label: action.label, onClick: action.onClick },
  });
}

/** Stays until dismissed or the retry action is used, per COMPONENTS.md "Feedback". */
export function showErrorToast(title: string, description?: string, action?: ToastAction) {
  toast.error(title, {
    description,
    duration: Infinity,
    action: action && { label: action.label, onClick: action.onClick },
  });
}
