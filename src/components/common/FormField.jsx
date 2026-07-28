export default function FormField({
  label,
  htmlFor,
  required = false,
  hint = "",
  error = "",
  className = "",
  children
}) {
  return (
    <div className={`field ${className}`.trim()}>
      <label htmlFor={htmlFor}>
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
      <span className="field-error" aria-live="polite">{error}</span>
    </div>
  );
}
