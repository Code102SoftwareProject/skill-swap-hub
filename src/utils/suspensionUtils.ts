import { redirectToSuspendedPage } from "@/components/auth/AccountSuspended";

/**
 * Utility functions for handling user suspension alerts and redirects
 */

export interface SuspensionDetails {
  reason?: string;
  notes?: string;
  suspensionDate?: string;
  adminName?: string;
}

/**
 * Handle suspension response from API calls
 * @param response - API response that may contain suspension details
 * @returns true if user is suspended, false otherwise
 */
export const handleSuspensionResponse = (response: any): boolean => {
  if (response.error === "User is suspended" || response.suspended) {
    const suspensionData: SuspensionDetails = {
      reason:
        response.suspensionDetails?.reason ||
        response.reason ||
        "Account suspended",
      notes: response.suspensionDetails?.notes || response.notes,
      suspensionDate:
        response.suspensionDetails?.suspensionDate || response.suspensionDate,
      adminName: response.suspensionDetails?.adminName || response.adminName,
    };

    // Store suspension data and redirect
    redirectToSuspendedPage(suspensionData);
    return true;
  }
  return false;
};

/**
 * Create props for SuspendedAlert component from API response
 * @param response - API response containing suspension details
 * @returns Props for SuspendedAlert component
 */
export const createSuspendedAlertProps = (response: any) => {
  return {
    reason:
      response.suspensionDetails?.reason ||
      response.reason ||
      "Account suspended",
    notes: response.suspensionDetails?.notes || response.notes,
    suspensionDate:
      response.suspensionDetails?.suspensionDate || response.suspensionDate,
    showContactButton: true,
    variant: "default" as const,
  };
};

/**
 * Enhanced fetch wrapper that handles suspension responses
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Promise that resolves with response or redirects if suspended
 */
export const fetchWithSuspensionHandler = async (
  url: string,
  options?: RequestInit
) => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Check if user is suspended
    if (handleSuspensionResponse(data)) {
      // User is suspended, redirect has been triggered
      throw new Error("User is suspended");
    }

    return { response, data };
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

/**
 * Hook-like function to provide suspension alert functionality
 * This can be used in components that need to show suspension alerts
 */
export const useSuspensionAlert = () => {
  const showSuspensionAlert = (suspensionData: SuspensionDetails) => {
    // For now, redirect to the dedicated page
    // In the future, this could integrate with a modal system
    redirectToSuspendedPage(suspensionData);
  };

  const checkAndHandleSuspension = (apiResponse: any) => {
    return handleSuspensionResponse(apiResponse);
  };

  return {
    showSuspensionAlert,
    checkAndHandleSuspension,
    createAlertProps: createSuspendedAlertProps,
  };
};

/**
 * Constants for suspension-related messaging
 */
export const SUSPENSION_MESSAGES = {
  DEFAULT: "Your account has been suspended",
  VIOLATION: "Account suspended due to terms of service violation",
  SPAM: "Account suspended for spam or inappropriate content",
  FRAUD: "Account suspended due to suspicious activity",
  ABUSE: "Account suspended for abusive behavior",
  SECURITY: "Account suspended for security reasons",
  CONTACT_SUPPORT: "Please contact support for more information",
};

/**
 * Type guard to check if an API response indicates suspension
 */
export const isSuspensionResponse = (
  response: any
): response is {
  error: string;
  suspended: boolean;
  suspensionDetails?: SuspensionDetails;
} => {
  return (
    response &&
    (response.error === "User is suspended" ||
      response.suspended === true ||
      response.suspensionDetails)
  );
};

const suspensionUtils = {
  handleSuspensionResponse,
  createSuspendedAlertProps,
  fetchWithSuspensionHandler,
  useSuspensionAlert,
  SUSPENSION_MESSAGES,
  isSuspensionResponse,
};

export default suspensionUtils;
