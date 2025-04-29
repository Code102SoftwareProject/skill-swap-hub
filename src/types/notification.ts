// Type definitions
export interface NotificationProps {
  notification: {
    _id: string;
    type: string;
    description: string;
    isRead: boolean;
    createdAt: string | Date;
    targetDestination?: string | null;
  };
  onMarkAsRead: (id: string) => void;
}