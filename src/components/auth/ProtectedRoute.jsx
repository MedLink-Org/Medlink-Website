import { LoaderCircle } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { defaultRouteForRole, hasPermission } from "../../auth/accessControl";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children, permission }) {
  const { authenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="auth-shell">
        <div className="auth-state" role="status" aria-live="polite">
          <LoaderCircle className="data-state-spinner" />
          <strong>Checking your session</strong>
          <p>Confirming access with the MedLink authentication service.</p>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (permission && !hasPermission(user?.role, permission)) {
    return <Navigate to={defaultRouteForRole(user?.role)} replace />;
  }

  return children;
}
