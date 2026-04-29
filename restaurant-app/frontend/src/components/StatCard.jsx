import Card from './Card.jsx';

export default function StatCard({ label, value, helper, delta, tone = 'accent' }) {
  return (
    <Card className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        {delta ? <span className="stat-card__delta">{delta}</span> : null}
      </div>
      <strong className="stat-card__value">{value}</strong>
      {helper ? <span className="stat-card__helper">{helper}</span> : null}
    </Card>
  );
}
