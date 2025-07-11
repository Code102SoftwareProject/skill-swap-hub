"use client";

import React from "react";
import { AlertCircle, Shield, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SuspendedAlertProps {
  /** The suspension reason to display */
  reason?: string;
  /** Additional notes or details about the suspension */
  notes?: string;
  /** Date when the suspension occurred */
  suspensionDate?: string;
  /** Whether to show the contact support button */
  showContactButton?: boolean;
  /** Custom contact email (defaults to support@skillswaphub.com) */
  contactEmail?: string;
  /** Custom CSS classes */
  className?: string;
  /** Whether the alert can be dismissed */
  dismissible?: boolean;
  /** Callback when alert is dismissed */
  onDismiss?: () => void;
  /** Variant of the alert */
  variant?: "default" | "compact" | "banner";
  /** Custom title for the alert */
  title?: string;
}

/**
 * SuspendedAlert - A reusable component for displaying account suspension messages
 *
 * Features:
 * - Accessible with proper ARIA attributes
 * - Customizable suspension reason and notes
 * - Contact support functionality
 * - Multiple variants (default, compact, banner)
 * - Dismissible option
 * - Consistent with project's design system
 */
export const SuspendedAlert: React.FC<SuspendedAlertProps> = ({
  reason = "Your account has been suspended",
  notes,
  suspensionDate,
  showContactButton = true,
  contactEmail = "support@skillswaphub.com",
  className,
  dismissible = false,
  onDismiss,
  variant = "default",
  title = "Account Suspended",
}) => {
  const handleContactSupport = () => {
    const subject = encodeURIComponent("Account Suspension Appeal");
    const body = encodeURIComponent(
      `Hello Support Team,\n\nI would like to appeal my account suspension.\n\nSuspension Reason: ${reason}\n${suspensionDate ? `Suspension Date: ${suspensionDate}\n` : ""}${notes ? `Additional Details: ${notes}\n` : ""}\nPlease review my account and provide guidance on how to resolve this issue.\n\nThank you for your assistance.`
    );
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  };

  // Banner variant for full-width alerts
  if (variant === "banner") {
    return (
      <div
        className={cn(
          "relative w-full bg-red-50 border-l-4 border-red-500 p-4",
          className
        )}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-red-500" aria-hidden="true" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">{title}</h3>
            <p className="text-sm text-red-700 mt-1">{reason}</p>
            {notes && <p className="text-sm text-red-600 mt-1">{notes}</p>}
            {suspensionDate && (
              <p className="text-xs text-red-500 mt-1">
                Suspended on: {new Date(suspensionDate).toLocaleDateString()}
              </p>
            )}
            {showContactButton && (
              <div className="mt-3">
                <Button
                  onClick={handleContactSupport}
                  variant="outline"
                  size="sm"
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            )}
          </div>
          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 ml-3 text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md p-1"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Compact variant for smaller spaces
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "relative flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-md",
          className
        )}
        role="alert"
        aria-live="polite"
      >
        <AlertCircle
          className="h-5 w-5 text-red-500 flex-shrink-0"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800 truncate">{reason}</p>
          {suspensionDate && (
            <p className="text-xs text-red-500">
              {new Date(suspensionDate).toLocaleDateString()}
            </p>
          )}
        </div>
        {showContactButton && (
          <Button
            onClick={handleContactSupport}
            variant="outline"
            size="sm"
            className="text-red-700 border-red-300 hover:bg-red-100 flex-shrink-0"
          >
            <Mail className="h-4 w-4" />
          </Button>
        )}
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md p-1"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // Default card variant
  return (
    <Card
      className={cn("border-red-200 bg-red-50", className)}
      role="alert"
      aria-live="polite"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Shield className="h-6 w-6 text-red-500" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-red-800">
                {title}
              </CardTitle>
              <CardDescription className="text-red-600 mt-1">
                Access to your account has been restricted
              </CardDescription>
            </div>
          </div>
          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md p-1"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-md border border-red-200">
            <p className="text-sm font-medium text-red-800 mb-1">
              Suspension Reason:
            </p>
            <p className="text-sm text-red-700">{reason}</p>
          </div>

          {notes && (
            <div className="bg-white p-3 rounded-md border border-red-200">
              <p className="text-sm font-medium text-red-800 mb-1">
                Additional Details:
              </p>
              <p className="text-sm text-red-700">{notes}</p>
            </div>
          )}

          {suspensionDate && (
            <div className="flex items-center gap-2 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" />
              <span>
                Suspended on:{" "}
                {new Date(suspensionDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}

          {showContactButton && (
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={handleContactSupport}
                variant="outline"
                className="text-red-700 border-red-300 hover:bg-red-100 flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="ghost"
                className="text-red-600 hover:bg-red-100 flex-1"
              >
                Return to Home
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Export convenience hooks for different use cases
export const useSuspendedAlert = () => {
  const showSuspendedAlert = (suspensionData: {
    reason?: string;
    notes?: string;
    suspensionDate?: string;
    adminName?: string;
  }) => {
    // This could be integrated with the existing toast system
    // For now, it returns the props needed for the SuspendedAlert component
    return {
      reason: suspensionData.reason || "Your account has been suspended",
      notes: suspensionData.notes,
      suspensionDate: suspensionData.suspensionDate,
      title: "Account Suspended",
      showContactButton: true,
      variant: "default" as const,
    };
  };

  return { showSuspendedAlert };
};

export default SuspendedAlert;
