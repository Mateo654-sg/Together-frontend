interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  count?: number;
}

export function Skeleton({ width = '100%', height = '16px', borderRadius, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ width, height, borderRadius, marginBottom: count > 1 ? '12px' : 0 }}
        />
      ))}
    </>
  );
}

export function SkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ padding: '24px' }}>
          <Skeleton width="40%" height="14px" count={2} />
          <Skeleton width="60%" height="28px" />
        </div>
      ))}
    </>
  );
}
