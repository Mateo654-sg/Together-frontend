import { useMemo } from 'react';
import { ChevronDown, Copy, Edit2, Trash2 } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { MoneyDisplay } from '@/shared/components/MoneyDisplay';
import { formatRelative } from '@/shared/utils/format';
import { getGroupLabel, getMovementIcon, type ActivityItem } from '@/shared/utils/activity';

interface ActivityListProps {
  items: ActivityItem[];
  onRowClick?: (item: ActivityItem) => void;
  onEdit?: (item: ActivityItem) => void;
  onDuplicate?: (item: ActivityItem) => void;
  onDelete?: (item: ActivityItem) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export function ActivityList({
  items,
  onRowClick,
  onEdit,
  onDuplicate,
  onDelete,
  hasMore,
  loadingMore,
  onLoadMore,
}: ActivityListProps) {
  const grouped = useMemo(() => {
    return items.reduce<Record<string, ActivityItem[]>>((groups, item) => {
      const label = getGroupLabel(item.createdAt);
      (groups[label] ??= []).push(item);
      return groups;
    }, {});
  }, [items]);

  const hasActions = Boolean(onEdit || onDuplicate || onDelete);

  return (
    <div className="activity-groups">
      {Object.entries(grouped).map(([label, groupItems]) => (
        <section key={label} className="activity-group">
          <h2>{label}</h2>
          <Card hover={false} className="activity-list-card">
            {groupItems.map((item) => (
              <div
                key={`${item._type}-${item.id}`}
                className="activity-row"
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                <div className="activity-row__icon" aria-hidden="true">{getMovementIcon(item)}</div>
                <div className="activity-row__main">
                  <div className="activity-row__title">{item.description}</div>
                  <div className="activity-row__meta">
                    <span>{item.category}</span>
                    <span>{formatRelative(item.createdAt)}</span>
                  </div>
                </div>
                <div className={`activity-row__indicator activity-row__indicator--${item._type}`} aria-hidden="true" />
                <div className="activity-row__amount">
                  <MoneyDisplay
                    amount={item._type === 'expense' ? -item.amount : item.amount}
                    size="md"
                    color={item._type === 'expense' ? 'negative' : 'positive'}
                  />
                </div>
                {hasActions && (
                  <div className="activity-row__actions" onClick={(event) => event.stopPropagation()}>
                    {onEdit && (
                      <button type="button" title="Editar" onClick={() => onEdit(item)}>
                        <Edit2 size={14} />
                      </button>
                    )}
                    {onDuplicate && (
                      <button type="button" title="Duplicar" onClick={() => onDuplicate(item)}>
                        <Copy size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button type="button" title="Eliminar" onClick={() => onDelete(item)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </Card>
        </section>
      ))}
      {hasMore && (
        <div className="activity-load-more">
          <button className="btn btn--ghost btn--sm" type="button" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? <span className="btn__loader" /> : <><ChevronDown size={16} /> Cargar más</>}
          </button>
        </div>
      )}
    </div>
  );
}
