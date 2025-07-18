"use client";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
// Toast types
const TOAST_SUCCESS: ToastType = "success";
const TOAST_ERROR: ToastType = "error";
const TOAST_WARNING: ToastType = "warning";

// Duration before auto-dismiss (in milliseconds)
const TOAST_DURATION_MS = 5000;

// ─── IMPORTS ─────────────────────────────────────────────────────────────────
import { useEffect } from "react";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
export type ToastType = "success" | "error" | "warning";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function Toast({ message, type, onClose }: ToastProps) {
  // Determine background color based on toast type
  const bgColor =
    type === TOAST_SUCCESS
      ? "bg-green-500"
      : type === TOAST_ERROR
      ? "bg-red-500"
      : "bg-yellow-500";

  // Select appropriate icon for each toast type
  const icon =
    type === TOAST_SUCCESS ? (
      <CheckCircle size={20} />
    ) : type === TOAST_ERROR ? (
      <XCircle size={20} />
    ) : (
      <AlertCircle size={20} />
    );

  // Automatically dismiss toast after TOAST_DURATION_MS
  useEffect(() => {
    const timer = setTimeout(onClose, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`${bgColor} text-white p-4 rounded-lg shadow-lg flex items-center space-x-2 mb-4`}
    >
      {/* Toast icon */}
      {icon}

      {/* Toast message */}
      <span>{message}</span>

      {/* Manual close button */}
      <button
        onClick={onClose}
        className="ml-auto text-white hover:text-gray-200"
      >
        <XCircle size={18} />
      </button>
    </div>
  );
}
