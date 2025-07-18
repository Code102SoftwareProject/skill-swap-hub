"use client";

// ─── TOP-LEVEL CONSTANTS ──────────────────────────────────────────────────────
const ROLE_SUPER_ADMIN = "super_admin";
const ROLE_ADMIN = "admin";

// ─── IMPORTS ──────────────────────────────────────────────────────────────────
import React from "react";
import { CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

// ─── TYPE DEFINITIONS ─────────────────────────────────────────────────────────
// Represents a single permission option
interface Permission {
  key: string;
  label: string;
  description: string;
}

// Data model for creating a new admin
interface CreateAdminData {
  username: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
}

// Props accepted by the create-admin modal component
interface AdminCreateModalProps {
  form: CreateAdminData;
  onChange: (data: CreateAdminData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  availablePermissions: Permission[];
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function AdminCreateModal({
  form,
  onChange,
  onSubmit,
  onClose,
  availablePermissions,
  showPassword,
  setShowPassword,
}: AdminCreateModalProps) {
  // Trimmed email for validation
  const email = form.email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // null = untouched, true/false = validity
  const isEmailValid = email === "" ? null : emailRegex.test(email);

  // Password strength: at least 8 chars, one uppercase, one digit
  const pwd = form.password;
  const pwdRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  const isPasswordValid = pwd === "" ? null : pwdRegex.test(pwd);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Modal backdrop and container */}
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create New Admin</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* ── Username & Email ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={form.username}
                onChange={e => onChange({ ...form, username: e.target.value })}
                placeholder="At least 4 characters"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                minLength={4}
              />
            </div>
            {/* Email input with live validation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={form.email}
                  onChange={e => onChange({ ...form, email: e.target.value })}
                  placeholder="admin@example.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    email === ""
                      ? "border-gray-300"
                      : isEmailValid
                      ? "border-green-300"
                      : "border-red-300"
                  }`}
                  required
                />
                {email && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isEmailValid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {email && (
                <p
                  className={`text-xs mt-1 ${
                    isEmailValid ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isEmailValid
                    ? "Valid email format"
                    : "Please enter a valid email address"}
                </p>
              )}
            </div>
          </div>

          {/* ── Password Input with Visibility Toggle ──────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={e => onChange({ ...form, password: e.target.value })}
                placeholder="Min 8 chars, 1 uppercase, 1 digit"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  pwd === ""
                    ? "border-gray-300"
                    : isPasswordValid
                    ? "border-green-300"
                    : "border-red-300"
                }`}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {pwd && (
              <p
                className={`text-xs mt-1 ${
                  isPasswordValid ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPasswordValid
                  ? "Strong password"
                  : "Use 8+ chars, including uppercase & digit"}
              </p>
            )}
          </div>

          {/* ── Role Selector ──────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={form.role}
              onChange={e => onChange({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={ROLE_ADMIN}>Admin</option>
              <option value={ROLE_SUPER_ADMIN}>Super Admin</option>
            </select>
          </div>

          {/* ── Permissions Display ───────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Permissions
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
              {form.role === ROLE_SUPER_ADMIN ? (
                // Super admins have all permissions granted
                <div className="space-y-2">
                  {availablePermissions.map(perm => (
                    <div
                      key={perm.key}
                      className="flex items-start bg-purple-50 p-2 rounded"
                    >
                      <CheckCircle className="mt-1 h-4 w-4 text-purple-600 flex-shrink-0" />
                      <div className="ml-2 text-sm">
                        <div className="font-medium text-gray-900">
                          {perm.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {perm.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Regular admins see all except the manage_admins permission
                <div className="space-y-2">
                  {availablePermissions
                    .filter(p => p.key !== "manage_admins")
                    .map(perm => (
                      <div
                        key={perm.key}
                        className="flex items-start bg-gray-50 p-2 rounded"
                      >
                        <CheckCircle className="mt-1 h-4 w-4 text-green-600 flex-shrink-0" />
                        <div className="ml-2 text-sm">
                          <div className="font-medium text-gray-900">
                            {perm.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {perm.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  {/* Explicitly indicate that manage_admins is unavailable */}
                  <div className="flex items-start bg-red-50 p-2 rounded">
                    <XCircle className="mt-1 h-4 w-4 text-red-600 flex-shrink-0" />
                    <div className="ml-2 text-sm">
                      <div className="font-medium text-gray-900">
                        Manage Admins
                      </div>
                      <div className="text-xs text-red-500">
                        Not available for regular admins
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Action Buttons ──────────────────────────────────────────────── */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}