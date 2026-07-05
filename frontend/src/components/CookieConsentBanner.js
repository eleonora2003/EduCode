import React from "react";
import { useCookieConsent } from "../context/CookieConsentContext";

function CookieConsentBanner() {
  const {
    isBannerVisible,
    acceptAll,
    rejectAll,
    openPreferencesModal,
    COOKIE_CATEGORIES
  } = useCookieConsent();

  if (!isBannerVisible) return null;

  return (
    <div className="cookie-banner" role="alertdialog" aria-labelledby="cookie-banner-title">
      <div className="cookie-banner-content">
        <div className="cookie-banner-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="9" r="1.5" fill="currentColor"/>
          </svg>
        </div>
        
        <div className="cookie-banner-text">
          <h3 id="cookie-banner-title">We value your privacy</h3>
          <p>
            We use cookies to enhance your browsing experience, serve personalized content, 
            and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. 
            You can also choose to "Reject All" non-essential cookies or "Customize" your preferences.
          </p>
          <a href="/privacy" className="cookie-banner-link" target="_blank" rel="noopener noreferrer">
            Learn more in our Cookie Policy
          </a>
        </div>
      </div>
      
      <div className="cookie-banner-actions">
        <button
          type="button"
          className="btn-cookie-reject"
          onClick={rejectAll}
          aria-label="Reject all non-essential cookies"
        >
          Reject All
        </button>
        
        <button
          type="button"
          className="btn-cookie-customize"
          onClick={openPreferencesModal}
          aria-label="Customize cookie preferences"
        >
          Customize
        </button>
        
        <button
          type="button"
          className="btn-cookie-accept"
          onClick={acceptAll}
          aria-label="Accept all cookies"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}

export default CookieConsentBanner;