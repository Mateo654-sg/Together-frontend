import type { CSSProperties, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', style, hover = true, onClick }: CardProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`card ${hover ? 'card--hover' : ''} ${className}`}
      style={style}
      onClick={onClick}
      {...(onClick ? { type: 'button' as const } : {})}
    >
      {children}
    </Tag>
  );
}

export function CardGrid({ children, columns = 3 }: { children: ReactNode; columns?: number }) {
  return (
    <div className="card-grid" style={{ '--card-grid-columns': columns } as React.CSSProperties}>
      {children}
    </div>
  );
}
