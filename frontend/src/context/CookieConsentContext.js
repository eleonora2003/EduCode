import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

// Cookie categories with descriptions
export const COOKIE_CATEGORIES = {
  necessary: {
    id: "necessary",
    name: "Necessary",
    description: "These cookies are essential for the website to function properly and cannot be disabled. They are usually only set in response to actions made by you such as logging in, setting your privacy preferences, or filling in forms.",
    required: true,
    enabled: true
  },
  analytics: {
    id: "analytics",
    name: "Analytics",
    description: "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.",
    required: false,
    enabled: false
  },
  marketing: {
    id: "marketing",
    name: "Marketing",
    description: "These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites. They do not store directly personal information but are based on uniquely identifying your browser and internet device.",
    required: false,
    enabled: false
  },
  preferences: {
    id: "preferences",
    name: "Preferences",
    description: "These cookies allow the website to provide enhanced functionality and personalisation. They may be set by us or by third party providers whose services we have added to our pages. If you do not allow these cookies then some or all of these services may not function properly.",
    required: false,
    enabled: false
  }
};

const CONSENT_STORAGE_KEY = "educode_cookie_consent";
const CONSENT_VERSION = "1.0";

const CookieConsentContext = createContext(null);

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(null);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load consent from localStorage on mount
  useEffect(() => {
    const loadConsent = () => {
      try {
        const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
        if (storedConsent) {
          const parsed = JSON.parse(storedConsent);
          // Check if consent version matches (for re-prompting on policy updates)
          if (parsed.version === CONSENT_VERSION) {
            setConsent(parsed);
            setIsBannerVisible(false);
          } else {
            // Old version, show banner again
            setIsBannerVisible(true);
          }
        } else {
          // No consent given yet, show banner
          setIsBannerVisible(true);
        }
      } catch (error) {
        console.error("Error loading cookie consent:", error);
        setIsBannerVisible(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadConsent();
  }, []);

  // Save consent to localStorage
  const saveConsent = useCallback((newConsent) => {
    try {
      const consentData = {
        ...newConsent,
        version: CONSENT_VERSION,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));
      setConsent(consentData);
    } catch (error) {
      console.error("Error saving cookie consent:", error);
    }
  }, []);

  // Accept all cookies
  const acceptAll = useCallback(() => {
    const allAccepted = {};
    Object.keys(COOKIE_CATEGORIES).forEach(key => {
      allAccepted[key] = true;
    });
    const newConsent = {
      ...allAccepted,
      timestamp: new Date().toISOString()
    };
    saveConsent(newConsent);
    setIsBannerVisible(false);
    setIsModalOpen(false);
  }, [saveConsent]);

  // Reject all non-essential cookies
  const rejectAll = useCallback(() => {
    const rejectionState = {};
    Object.keys(COOKIE_CATEGORIES).forEach(key => {
      rejectionState[key] = COOKIE_CATEGORIES[key].required;
    });
    const newConsent = {
      ...rejectionState,
      timestamp: new Date().toISOString()
    };
    saveConsent(newConsent);
    setIsBannerVisible(false);
    setIsModalOpen(false);
  }, [saveConsent]);

  // Save custom preferences
  const savePreferences = useCallback((preferences) => {
    const newConsent = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    saveConsent(newConsent);
    setIsBannerVisible(false);
    setIsModalOpen(false);
  }, [saveConsent]);

  // Check if a specific cookie category is allowed
  const isAllowed = useCallback((category) => {
    if (!consent) return false;
    // Necessary cookies are always allowed
    if (category === "necessary") return true;
    return consent[category] === true;
  }, [consent]);

  // Open preferences modal
  const openPreferencesModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  // Close preferences modal
  const closePreferencesModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Reset consent (for testing or if user wants to re-decide)
  const resetConsent = useCallback(() => {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    setConsent(null);
    setIsBannerVisible(true);
  }, []);

  // Get current consent status for display
  const getConsentStatus = useCallback(() => {
    if (!consent) return null;
    const status = {};
    Object.keys(COOKIE_CATEGORIES).forEach(key => {
      status[key] = consent[key] || false;
    });
    return status;
  }, [consent]);

  const value = useMemo(() => ({
    consent,
    isBannerVisible,
    isModalOpen,
    isLoading,
    acceptAll,
    rejectAll,
    savePreferences,
    isAllowed,
    openPreferencesModal,
    closePreferencesModal,
    resetConsent,
    getConsentStatus,
    COOKIE_CATEGORIES
  }), [
    consent,
    isBannerVisible,
    isModalOpen,
    isLoading,
    acceptAll,
    rejectAll,
    savePreferences,
    isAllowed,
    openPreferencesModal,
    closePreferencesModal,
    resetConsent,
    getConsentStatus
  ]);

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within a CookieConsentProvider");
  }
  return context;
}