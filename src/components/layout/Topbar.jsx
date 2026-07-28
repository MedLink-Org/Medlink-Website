import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { useState } from "react";
import { useMatches, useNavigate } from "react-router-dom";

export default function Topbar({ onMenuClick }) {
  const matches = useMatches();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const currentTitle = [...matches].reverse().find(match => match.handle?.title)?.handle.title || "MedLink";

  function handleSearch(event) {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/patients?q=${encodeURIComponent(value)}` : "/patients");
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
        <form className="global-search" onSubmit={handleSearch}>
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
        </form>
        <button className="icon-button notification-button" type="button" aria-label="Notifications" title="Notifications">
          <Bell />
          <span className="notification-dot" aria-hidden="true" />
        </button>
        <div className="profile">
          <span className="avatar">AO</span>
          <div>
            <strong>Amara Okafor</strong>
            <small>Clinic Administrator</small>
          </div>
          <ChevronDown />
        </div>
      </div>
    </header>
  );
}
