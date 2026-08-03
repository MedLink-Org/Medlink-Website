import { Bell, ChevronDown, LogOut, Menu, Search, UserPlus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMatches, useNavigate } from "react-router-dom";
import { ROLES } from "../../auth/accessControl";
import { useAuth } from "../../context/AuthContext";
import { useMedLink } from "../../context/MedLinkContext";
import { useToast } from "../../context/ToastContext";
import { initials } from "../../utils/format";

const registrationGroups = [
  { key: "patients", idKey: "patientId", label: "Patient", route: "/patients" },
  { key: "doctors", idKey: "doctorId", label: "Doctor", route: "/doctors" },
  { key: "nurses", idKey: "nurseId", label: "Nurse", route: "/nurses" },
  { key: "staff", idKey: "staffId", label: "Staff", route: "/" }
];

function registrationTimestamp(person) {
  const value = person.createdAt
    ?? person.created_at
    ?? person.registeredAt
    ?? person.registered_at;
  const timestamp = value ? new Date(value).getTime() : Number.NaN;
  return Number.isNaN(timestamp) ? null : timestamp;
}

export default function Topbar({ onMenuClick }) {
  const matches = useMatches();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const clinicRecords = useMedLink();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const notificationMenuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const currentTitle = [...matches].reverse().find(match => match.handle?.title)?.handle.title || "MedLink";
  const displayName = user?.name || user?.email?.split("@")[0] || "Clinic User";
  const nameParts = displayName.trim().split(/\s+/);
  const avatarText = initials(user?.firstName || nameParts[0], user?.lastName || nameParts.at(-1));
  const isPatientAccount = user?.role === ROLES.PATIENT;
  const registrationNotifications = useMemo(() => registrationGroups
    .flatMap((group, groupIndex) => {
      const records = clinicRecords[group.key] || [];
      return records.map((person, index) => ({
        id: `${group.key}:${person[group.idKey] || index}`,
        clinicId: person[group.idKey] || "Pending ID",
        groupIndex,
        index,
        label: group.label,
        name: [person.firstName, person.lastName].filter(Boolean).join(" ") || group.label,
        route: group.route,
        timestamp: registrationTimestamp(person)
      }));
    })
    .sort((a, b) => {
      if (a.timestamp !== null || b.timestamp !== null) {
        return (b.timestamp ?? 0) - (a.timestamp ?? 0);
      }
      if (a.index !== b.index) return b.index - a.index;
      return a.groupIndex - b.groupIndex;
    })
    .slice(0, 6), [clinicRecords]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
      if (!notificationMenuRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
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
        <div className="notification-menu" ref={notificationMenuRef}>
          <button
            className="icon-button notification-button"
            type="button"
            aria-label={`Notifications, ${registrationNotifications.length} recent registrations`}
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            title="Notifications"
            onClick={() => {
              setNotificationsOpen(current => !current);
              setProfileOpen(false);
            }}
          >
            <Bell />
            {registrationNotifications.length > 0 && (
              <span className="notification-count" aria-hidden="true">
                {registrationNotifications.length}
              </span>
            )}
          </button>
          {notificationsOpen && (
            <section className="notification-popover" role="dialog" aria-label="Recent registrations">
              <div className="notification-popover-heading">
                <div>
                  <strong>Notifications</strong>
                  <small>Newly registered users</small>
                </div>
                <span>{registrationNotifications.length}</span>
              </div>
              <div className="registration-notifications">
                {registrationNotifications.length ? registrationNotifications.map(notification => (
                  <button
                    type="button"
                    className="registration-notification"
                    key={notification.id}
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate(notification.route);
                    }}
                  >
                    <span className="registration-notification-icon" aria-hidden="true">
                      <UserPlus />
                    </span>
                    <span>
                      <strong>{notification.name}</strong>
                      <small>{notification.label} registration</small>
                    </span>
                    <span className="registration-notification-id">{notification.clinicId}</span>
                  </button>
                )) : (
                  <div className="notification-empty">
                    <Bell />
                    <strong>No new registrations</strong>
                    <small>Newly registered users will appear here.</small>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
        <div className="profile-menu" ref={profileMenuRef}>
          <button
            className="profile"
            type="button"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            onClick={() => {
              setProfileOpen(current => !current);
              setNotificationsOpen(false);
            }}
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
