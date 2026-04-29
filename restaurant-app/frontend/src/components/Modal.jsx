export default function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  size = 'md',
  variant = 'center',
  closeLabel = '',
  closeIcon = false,
  className = '',
  backdropClassName = ''
}) {
  if (!open) return null;

  const backdropClass =
    variant === 'sheet'
      ? 'modal-backdrop--sheet'
      : variant === 'corner'
        ? 'modal-backdrop--corner'
        : '';

  const modalVariantClass =
    variant === 'sheet' ? 'modal--sheet' : variant === 'corner' ? 'modal--corner' : '';

  return (
    <div
      className={`modal-backdrop ${backdropClass} ${backdropClassName}`.trim()}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`modal modal--${size} ${modalVariantClass} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <div>
            <h3>{title}</h3>
          </div>
          {variant === 'sheet' || closeIcon ? (
            <button type="button" className="modal__close" aria-label="Fermer" onClick={onClose}>
              ×
            </button>
          ) : closeLabel ? (
            <button type="button" className="modal__close-text" onClick={onClose}>
              {closeLabel}
            </button>
          ) : null}
        </div>
        <div className="modal__body">{children}</div>
        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
