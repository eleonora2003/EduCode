import { useEffect, useRef, useState } from "react";
import {
  IconUser,
  IconHistory,
  IconSettings,
  IconLogout,
  IconClose,
} from "./icons";
import { useCookieConsent } from "../context/CookieConsentContext";

function splitName(fullName) {
  if (!fullName) return { firstName: "—", lastName: "—" };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "—" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export default function UserMenu({
  user,
  open,
  onToggle,
  onClose,
  onNavigate,
  onLogout,
  theme,
  onThemeChange,
}) {
  const menuRef = useRef(null);
  const [overlay, setOverlay] = useState(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (overlay) setOverlay(null);
        else onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, overlay]);

  const fullName = user?.full_name || user?.name || "";
  const { firstName, lastName } = splitName(fullName);
  const displayName = fullName || (user?.email ? user.email.split("@")[0] : "User");

  const openOverlay = (view) => {
    setOverlay(view);
    onClose();
  };

  const menuItems = [
    { id: "profile", label: "My Profile", icon: IconUser, action: () => openOverlay("profile") },
    { id: "history", label: "Task History", icon: IconHistory, action: () => { onNavigate("history"); onClose(); } },
    { id: "settings", label: "Preferences", icon: IconSettings, action: () => openOverlay("preferences") },
  ];

  return (
    <>
      <div className="user-menu-wrapper" ref={menuRef}>
        <button
          type="button"
          className={`user-menu-trigger ${open ? "open" : ""}`}
          onClick={onToggle}
          aria-expanded={open}
          aria-haspopup="true"
        >
          <div className="user-avatar-header">
            {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="user-info-header">
            <span className="user-name-header">{displayName}</span>
            <span className="user-role-header">Teacher</span>
          </div>
          <svg className={`user-menu-chevron ${open ? "open" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div className="user-dropdown" role="menu">
            <div className="user-dropdown-header">
              <div className="user-avatar-header large">
                {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <div className="user-dropdown-name">{displayName}</div>
                <div className="user-dropdown-email">{user?.email}</div>
              </div>
            </div>
            <div className="user-dropdown-divider" />
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} type="button" className="user-dropdown-item" role="menuitem" onClick={item.action}>
                  <span className="user-dropdown-icon"><Icon /></span>
                  {item.label}
                </button>
              );
            })}
            <div className="user-dropdown-divider" />
            <button type="button" className="user-dropdown-item danger" role="menuitem" onClick={() => { onClose(); onLogout(); }}>
              <span className="user-dropdown-icon"><IconLogout /></span>
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {overlay === "profile" && (
        <button
          type="button"
          className="profile-overlay"
          onClick={() => setOverlay(null)}
          aria-label="Close profile panel"
        >
          <dialog
            className="profile-panel"
            open
          >
            <div className="profile-panel-header">
              <h2>My Profile</h2>
              <button type="button" className="profile-close" onClick={() => setOverlay(null)} aria-label="Close">
                <IconClose />
              </button>
            </div>
            <div className="profile-avatar-section">
              <div className="profile-avatar-large">
                {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
              </div>
            </div>
            <div className="profile-details">
              <div className="profile-detail-row">
                <span className="profile-detail-label">Name</span>
                <span className="profile-detail-value">{firstName}</span>
              </div>
              <div className="profile-detail-row">
                <span className="profile-detail-label">Surname</span>
                <span className="profile-detail-value">{lastName}</span>
              </div>
              <div className="profile-detail-row">
                <span className="profile-detail-label">Email</span>
                <span className="profile-detail-value">{user?.email || "—"}</span>
              </div>
            </div>
          </dialog>
        </button>
      )}

      {overlay === "preferences" && (
        <PreferencesPanel
          theme={theme}
          onThemeChange={onThemeChange}
          onClose={() => setOverlay(null)}
        />
      )}
    </>
  );
}

function PreferencesPanel({ theme, onThemeChange, onClose }) {
  const { openPreferencesModal } = useCookieConsent();

  return (
    <button
      type="button"
      className="profile-overlay"
      onClick={onClose}
      aria-label="Close preferences panel"
    >
      <dialog
        className="profile-panel"
        open
      >
        <div className="profile-panel-header">
          <h2>Preferences</h2>
          <button type="button" className="profile-close" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>
        <div className="pref-section">
          <span className="pref-label">Theme</span>
          <div className="theme-picker">
            <button
              type="button"
              className={`theme-option ${theme === "light" ? "active" : ""}`}
              onClick={() => onThemeChange("light")}
            >
              <span className="theme-swatch light" />Light
            </button>
            <button
              type="button"
              className={`theme-option ${theme === "dark" ? "active" : ""}`}
              onClick={() => onThemeChange("dark")}
            >
              <span className="theme-swatch dark" />Dark
            </button>
          </div>
        </div>
        <div className="pref-section">
          <span className="pref-label">Privacy</span>
          <button
            type="button"
            className="btn-cookie-prefs"
            onClick={() => {
              onClose();
              openPreferencesModal();
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
              <circle cx="15" cy="9" r="1.5" fill="currentColor"/>
            </svg>
            Cookie Preferences
          </button>
        </div>
      </dialog>
    </button>
  );
}