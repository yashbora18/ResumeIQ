import "./LoadingSpinner.css";

function LoadingSpinner({
  size = "medium",
  label = "Loading...",
}) {
  return (
    <div
      className={`rq-loading rq-loading--${size}`}
      role="status"
      aria-label={label}
    >
      <span className="rq-loading__ring" />
      <span className="rq-loading__text">{label}</span>
    </div>
  );
}

export default LoadingSpinner;