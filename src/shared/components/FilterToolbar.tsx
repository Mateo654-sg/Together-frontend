import { ArrowDownUp, ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { Card } from '@/shared/components/Card';

export interface FilterOption {
  key: string;
  label: string;
  showChevron?: boolean;
}

interface FilterToolbarProps {
  filters: FilterOption[];
  activeFilter: string;
  onFilterChange: (key: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  ariaLabel: string;
  sortLabel: string;
  onSortClick: () => void;
  onFilterClick: () => void;
}

export function FilterToolbar({
  filters,
  activeFilter,
  onFilterChange,
  search,
  onSearchChange,
  searchPlaceholder,
  ariaLabel,
  sortLabel,
  onSortClick,
  onFilterClick,
}: FilterToolbarProps) {
  return (
    <Card hover={false} className="activity-toolbar">
      <div className="activity-filter-chips" aria-label={ariaLabel}>
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`activity-chip ${activeFilter === f.key ? 'activity-chip--active' : ''}`}
            onClick={() => onFilterChange(f.key)}
          >
            {f.label}
            {f.showChevron && <ChevronDown size={14} />}
          </button>
        ))}
      </div>
      <label className="activity-search">
        <Search size={16} />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </label>
      <div className="activity-toolbar__actions">
        <button className="activity-tool-btn" type="button" onClick={onSortClick}>
          <ArrowDownUp size={16} /> {sortLabel} <ChevronDown size={14} />
        </button>
        <button className="activity-tool-btn" type="button" onClick={onFilterClick}>
          <SlidersHorizontal size={16} /> Filtrar <ChevronDown size={14} />
        </button>
      </div>
    </Card>
  );
}
