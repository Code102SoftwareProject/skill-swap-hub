"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuspensionDetails {
  reason?: string;
  suspensionDate?: string;
  notes?: string;
}

interface SuspendedPopupProps {
  message: string;
  details?: SuspensionDetails;
  isVisible: boolean;
  onClose: () => void;
}

/**
 * SuspendedPopup - A lightweight toast-style banner pinned top-right
 */
export function SuspendedPopup({
  message,
  details,
  isVisible,
  onClose,
}: SuspendedPopupProps) {
  if (!isVisible) return null;
  return (
    <div
      className="fixed top-4 right-4 max-w-sm bg-red-50 border-l-4 border-red-600 rounded-lg shadow p-4 flex items-start space-x-3 z-50"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
      <div className="flex-1 text-sm text-red-800 space-y-1">
        <p>{message}</p>
        {details?.reason && (
          <p>
            <strong>Reason:</strong> {details.reason}
          </p>
        )}
        {details?.notes && (
          <p>
            <strong>Notes:</strong> {details.notes}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-red-600 hover:text-red-800 p-1"
        aria-label="Dismiss suspension notification"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

// -------------------------------------------------------------------------
// Global state management for the suspension popup
// -------------------------------------------------------------------------
interface PopupState {
  isVisible: boolean;
  message: string;
  details?: SuspensionDetails;
  onClose?: () => void;
}

let popupState: PopupState = {
  isVisible: false,
  message: "",
  details: undefined,
  onClose: undefined,
};

const listeners = new Set<() => void>();
function notifyListeners() {
  listeners.forEach((fn) => fn());
}

/**
 * Hook to subscribe to global suspension popup state
 */
export function useSuspendedPopup() {
  const [state, setState] = useState(popupState);
  useEffect(() => {
    const listener = () => setState({ ...popupState });
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return state;
}

/**
 * Show the suspension popup
 */
export function showSuspendedPopup(
  message: string,
  details?: SuspensionDetails,
  onClose?: () => void
) {
  popupState = { isVisible: true, message, details, onClose };
  notifyListeners();
}

/**
 * Hide the suspension popup
 */
export function hideSuspendedPopup() {
  popupState.onClose?.();
  popupState = {
    isVisible: false,
    message: "",
    details: undefined,
    onClose: undefined,
  };
  notifyListeners();
}

/**
 * Provider to mount at the root of your app
 */
export function SuspendedPopupProvider() {
  const { isVisible, message, details, onClose } = useSuspendedPopup();
  return (
    <SuspendedPopup
      isVisible={isVisible}
      message={message}
      details={details}
      onClose={() => {
        onClose?.();
        hideSuspendedPopup();
      }}
    />
  );
}

/**
 * Helper to check API response and show popup if suspended
 */
export function handleSuspensionApiResponse(apiResponse: any): boolean {
  if (apiResponse.suspended || apiResponse.suspensionDetails) {
    const reason = apiResponse.suspensionDetails?.reason || "Policy violation";
    const notes = apiResponse.suspensionDetails?.notes;
    const when = apiResponse.suspensionDetails?.suspensionDate;
    let msg = `Your account has been suspended due to: ${reason}.`;
    if (notes) msg += `\nNotes: ${notes}.`;
    if (when) {
      const dateStr = new Date(when).toLocaleDateString();
      msg += `\nDate: ${dateStr}.`;
    }
    msg += "\n\nPlease contact support for assistance.";
    showSuspendedPopup(msg, { reason, suspensionDate: when, notes });
    return true;
  }
  return false;
}
