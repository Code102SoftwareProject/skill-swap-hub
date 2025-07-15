// UI State Types for components

export interface AlertState {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

export interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  confirmText?: string;
  loading?: boolean;
}

export type TabType = 'overview' | 'submit-work' | 'view-works' | 'progress' | 'report';

export type ReviewAction = 'accept' | 'reject';

export type CancelResponse = 'agree' | 'dispute';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';

export interface FileWithTitle {
  file: File;
  title: string;
}
