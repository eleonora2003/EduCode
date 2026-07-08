import React, { useState, useEffect } from "react";
import { useCookieConsent, COOKIE_CATEGORIES } from "../context/CookieConsentContext";

function CookiePreferencesModal() {
  const {
    isModalOpen,
    closePreferencesModal,
    acceptAll,
    rejectAll,
    savePreferences,
    consent,
    getConsentStatus
  } = useCookieConsent();

  const [preferences, setPreferences] = useState({});

  useEffect(() => {
    if (isModalOpen) {
      // Initialize preferences from current consent or defaults
      const currentStatus = getConsentStatus();
      if (currentStatus) {
        setPreferences(currentStatus);
      } else {
        const defaults = {};
        Object.keys(COOKIE_CATEGORIES).forEach(key => {
          defaults[key] = COOKIE_CATEGORIES[key].required;
        });
        setPreferences(defaults);
      }
      
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, getConsentStatus]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isModalOpen) {
        closePreferencesModal();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isModalOpen, closePreferencesModal]);

  const handleToggle = (categoryId) => {
    const category = COOKIE_CATEGORIES[categoryId];
    if (category.required) return; // Cannot toggle required categories

    setPreferences(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleSave = () => {
    savePreferences(preferences);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closePreferencesModal();
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="cookie-modal-overlay" onClick={handleOverlayClick} onKeyDown={handleOverlayClick} role="dialog" aria-labelledby="cookie-modal-title" tabIndex={-1}>
      <div className="cookie-modal" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <div className="cookie-modal-header">
          <div className="cookie-modal-header-content">
            <div className="cookie-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
                <circle cx="15" cy="9" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <h2 id="cookie-modal-title">Cookie Preferences</h2>
          </div>
          <button
            type="button"
            className="cookie-modal-close"
            onClick={closePreferencesModal}
            aria-label="Close preferences modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6 18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="cookie-modal-body">
          <p className="cookie-modal-description">
            We use cookies to enhance your browsing experience. Below you can choose which types of cookies you want to allow. 
            You can change your preferences at any time.
          </p>

          <div className="cookie-categories-list">
            {Object.values(COOKIE_CATEGORIES).map((category) => (
              <div key={category.id} className="cookie-category-item">
                <div className="cookie-category-header">
                  <div className="cookie-category-info">
                    <h3 className="cookie-category-name">
                      {category.name}
                      {category.required && (
                        <span className="cookie-category-badge">Required</span>
                      )}
                    </h3>
                  </div>
                  <label className="cookie-toggle">
                    <input
                      type="checkbox"
                      checked={preferences[category.id] || false}
                      onChange={() => handleToggle(category.id)}
                      disabled={category.required}
                      aria-label={`Enable ${category.name} cookies`}
                    />
                    <span className="cookie-toggle-slider"></span>
                  </label>
                </div>
                <p className="cookie-category-description">{category.description}</p>
              </div>
            ))}
          </div>

          {consent?.updatedAt && (
            <div className="cookie-modal-last-update">
              <small>
                Last updated: {new Date(consent.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </small>
            </div>
          )}
        </div>

        <div className="cookie-modal-footer">
          <button
            type="button"
            className="btn-cookie-reject"
            onClick={rejectAll}
          >
            Reject All
          </button>
          <button
            type="button"
            className="btn-cookie-save"
            onClick={handleSave}
          >
            Save Preferences
          </button>
          <button
            type="button"
            className="btn-cookie-accept"
            onClick={acceptAll}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookiePreferencesModal;