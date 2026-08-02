import { Bell, ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMatches, useNavigate } from "react-router-dom";
import { ROLES } from "../../auth/accessControl";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { initials } from "../../utils/format";

export default function Topbar({ onMenuClick }) {
  const matches = useMatches();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const profileMenuRef = useRef(null);
  const currentTitle = [...matches].reverse().find(match => match.handle?.title)?.handle.title || "MedLink";
  const displayName = user?.name || user?.email?.split("@")[0] || "Clinic User";
  const nameParts = displayName.trim().split(/\s+/);
  const avatarText = initials(user?.firstName || nameParts[0], user?.lastName || nameParts.at(-1));
  const isPatientAccount = user?.role === ROLES.PATIENT;

  useEffect(() => {
    function handlePointerDown(event) {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setProfileOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/patients?q=${encodeURIComponent(value)}` : "/patients");
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      showToast(
        "Sign out failed",
        error.message || "The authentication service could not end your session.",
        "error"
      );
    } finally {
      setSigningOut(false);
      setProfileOpen(false);
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-title">
        <button className="menu-button icon-button" type="button" aria-label="Toggle navigation" title="Toggle navigation" onClick={onMenuClick}>
          <Menu />
        </button>
        <div>
          <span>MedLink Hospital</span>
          <h1>{currentTitle}</h1>
        </div>
      </div>

      <div className="topbar-actions">
        {!isPatientAccount && <form className="global-search" onSubmit={handleSearch}>
          <Search />
          <label className="sr-only" htmlFor="globalSearch">Search patients</label>
          <input
            id="globalSearch"
            type="search"
            placeholder="Search patients..."
            autoComplete="off"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </form>}
        <button className="icon-button notification-button" type="button" aria-label="Notifications" title="Notifications">
          <Bell />
          <span className="notification-dot" aria-hidden="true" />
        </button>
        <div className="profile-menu" ref={profileMenuRef}>
          <button
            className="profile"
            type="button"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            onClick={() => setProfileOpen(current => !current)}
          >
            {user?.picture ? (
              <img className="avatar avatar-image" src={user.picture} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className="avatar">{avatarText}</span>
            )}
            <span className="profile-copy">
              <strong>{displayName}</strong>
              <small>{user?.roleLabel || "MedLink User"}</small>
            </span>
            <ChevronDown />
          </button>
          {profileOpen && (
            <div className="profile-popover" role="menu">
              <div className="profile-popover-user">
                <strong>{displayName}</strong>
                <small>{user?.email || "Authenticated account"}</small>
              </div>
              <button type="button" role="menuitem" disabled={signingOut} onClick={handleSignOut}>
                <LogOut />
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
