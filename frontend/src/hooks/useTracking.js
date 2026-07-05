import { useEffect } from "react";
import { useCookieConsent } from "../context/CookieConsentContext";

/**
 * Custom hook for conditionally loading tracking scripts based on cookie consent.
 * Only loads scripts when the user has given consent for the specified category.
 * 
 * @param {string} category - The cookie category (e.g., 'analytics', 'marketing')
 * @param {Function} trackingInit - The function to initialize tracking
 * @param {Array} dependencies - Dependencies array for the effect
 */
export function useTracking(category, trackingInit, dependencies = []) {
  const { isAllowed } = useCookieConsent();

  useEffect(() => {
    // Only initialize tracking if consent is given for this category
    if (isAllowed(category)) {
      // Cleanup function in case consent is revoked
      const cleanup = trackingInit();
      return cleanup;
    }
    // If no consent, don't load the tracking script
    return undefined;
  }, [category, isAllowed, ...dependencies]);
}

/**
 * Hook for Google Analytics (or similar analytics tools)
 */
export function useAnalyticsTracking(trackingId) {
  const { isAllowed } = useCookieConsent();

  useEffect(() => {
    if (!isAllowed('analytics') || !trackingId) return;

    // Example: Load Google Analytics
    console.log(`Analytics tracking initialized with ID: ${trackingId}`);

    return () => {
      console.log('Analytics tracking cleaned up');
    };
  }, [isAllowed, trackingId]);
}

/**
 * Hook for marketing/tracking pixels (Facebook Pixel, etc.)
 */
export function useMarketingTracking(pixelId) {
  const { isAllowed } = useCookieConsent();

  useEffect(() => {
    if (!isAllowed('marketing') || !pixelId) return;

    // Example: Load Facebook Pixel
    console.log(`Marketing pixel initialized with ID: ${pixelId}`);

    // Return cleanup function if needed
    return () => {
      console.log('Marketing pixel cleaned up');
    };
  }, [isAllowed, pixelId]);
}

/**
 * Hook for preference cookies (language, theme preferences stored in cookies)
 */
export function usePreferenceCookies() {
  const { isAllowed } = useCookieConsent();

  useEffect(() => {
    if (!isAllowed('preferences')) return;

    // Example: Store user preferences in cookies instead of localStorage
    console.log('Preference cookies enabled');

    return () => {
      console.log('Preference cookies cleaned up');
    };
  }, [isAllowed]);
}

export default useTracking;