import "./Card.css";

function Card({
  children,
  title,
  description,
  action,
  padding = "medium",
  className = "",
}) {
  const classes = [
    "rq-card",
    `rq-card--${padding}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes}>
      {(title || description || action) && (
        <header className="rq-card__header">
          <div className="rq-card__heading">
            {title && <h2 className="rq-card__title">{title}</h2>}

            {description && (
              <p className="rq-card__description">
                {description}
              </p>
            )}
          </div>

          {action && (
            <div className="rq-card__action">
              {action}
            </div>
          )}
        </header>
      )}

      <div className="rq-card__body">
        {children}
      </div>
    </section>
  );
}

export default Card;