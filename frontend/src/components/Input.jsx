export default function Input({
  label,
  error,
  hint,
  className = '',
  ...props
}) {
  return (
    <label className={`field ${className}`.trim()}>
      {label ? <span className="field__label">{label}</span> : null}
      <input className={`field__input ${error ? 'field__input--error' : ''}`.trim()} {...props} />
      {error ? <span className="field__error">{error}</span> : null}
      {!error && hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}
