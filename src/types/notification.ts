export interface Notification {
  _id: string;
  typename: string;       // Type name from the API
  color: string;          // Color code from the API
  description: string;
  isRead: boolean;
  createdAt: string | Date;
  targetDestination?: string | null;
}

export interface NotificationProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}