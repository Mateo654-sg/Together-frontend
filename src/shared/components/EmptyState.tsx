import { type LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <Icon size={32} />
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {message && <p className="empty-state__message">{message}</p>}
      {action && (
        <button className="btn btn--primary btn--sm" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
