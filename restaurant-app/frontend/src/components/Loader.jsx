export function Spinner() {
  return <span className="spinner" aria-label="Chargement" />;
}

export function Skeleton({ height = 18, className = '' }) {
  return <div className={`skeleton ${className}`.trim()} style={{ height }} />;
}
