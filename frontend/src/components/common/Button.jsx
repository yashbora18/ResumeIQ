import { LoaderCircle } from "lucide-react";
import "./Button.css";

function Button({
  children,
  variant = "primary",
  size = "medium",
  type = "button",
  loading = false,
  disabled = false,
  fullWidth = false,
  icon = null,
  onClick,
  className = "",
}) {
  const classes = [
    "rq-button",
    `rq-button--${variant}`,
    `rq-button--${size}`,
    fullWidth ? "rq-button--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <LoaderCircle
          className="rq-button__spinner"
          size={18}
          aria-hidden="true"
        />
      ) : (
        icon && <span className="rq-button__icon">{icon}</span>
      )}

      <span>{loading ? "Please wait..." : children}</span>
    </button>
  );
}

export default Button;