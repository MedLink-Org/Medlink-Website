export default function PageHeading({ eyebrow, title, titleId, description, actions, className = "" }) {
  return (
    <div className={`page-heading ${className}`.trim()}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={titleId}>{title}</h2>
        <p>{description}</p>
      </div>
      {actions}
    </div>
  );
}
