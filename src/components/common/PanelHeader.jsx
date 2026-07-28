export default function PanelHeader({ icon: Icon, title, description, action, urgent = false }) {
  return (
    <div className="panel-header">
      <div>
        <h3>
          {Icon && <Icon className={urgent ? "danger-icon" : ""} />}
          {title}
        </h3>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
