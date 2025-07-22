"use client";

// ─── TOP-LEVEL CONSTANTS ──────────────────────────────────────────────────────
// Role identifiers used throughout the modal
const ROLE_SUPER_ADMIN = "super_admin";
const ROLE_ADMIN = "admin";

// ─── IMPORTS ──────────────────────────────────────────────────────────────────
import { CheckCircle, Eye, EyeOff, XCircle } from "lucide-react";

// ─── TYPE DEFINITIONS ─────────────────────────────────────────────────────────
// Defines the structure of a permission item
interface Permission {
  key: string;
  label: string;
  description: string;
}

// Payload for updating an admin
interface UpdateAdminData {
  adminId: string;
  username: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
}

// Tracks email validation state during edit
interface EmailValidation {
  isValid: boolean;
  message: string;
  isChecking: boolean;
}

// Props accepted by the AdminEditModal component
interface AdminEditModalProps {
  selectedAdmin: UpdateAdminData;
  form: UpdateAdminData;
  onChange: (data: UpdateAdminData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  emailValidation: EmailValidation;
  availablePermissions: Permission[];
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function AdminEditModal({
  selectedAdmin,
  form,
  onChange,
  onSubmit,
  onClose,
  emailValidation,
  availablePermissions,
  showPassword,
  setShowPassword,
}: AdminEditModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Modal container */}
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-900">
          Edit Admin: {selectedAdmin.username}
        </h2>

        {/* Form starts here */}
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Username & Email fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1  dark:text-gray-700">
                Username
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) =>
                  onChange({ ...form, username: e.target.value })
                }
                placeholder="At least 4 characters"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-900"
                required
                minLength={4}
              />
            </div>

            {/* Email input with validation UI */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => onChange({ ...form, email: e.target.value })}
                  placeholder="admin@example.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent text-gray-900 dark:text-gray-900${
                    form.email === selectedAdmin.email
                      ? "border-gray-300 focus:ring-blue-500"
                      : emailValidation.isChecking
                        ? "border-yellow-300 focus:ring-yellow-500"
                        : emailValidation.isValid
                          ? "border-green-300 focus:ring-green-500"
                          : "border-red-300 focus:ring-red-500"
                  }`}
                  required
                />
                {/* Spinner while checking email */}
                {emailValidation.isChecking && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                  </div>
                )}
                {/* Success or error icon once checking completes */}
                {!emailValidation.isChecking &&
                  form.email !== selectedAdmin.email && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {emailValidation.isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
              </div>
              {/* Validation message below email */}
              <p
                className={`text-xs mt-1 ${
                  form.email === selectedAdmin.email
                    ? "text-gray-500"
                    : emailValidation.isChecking
                      ? "text-yellow-600"
                      : emailValidation.isValid
                        ? "text-green-600"
                        : emailValidation.message
                          ? "text-red-600"
                          : "text-gray-500"
                }`}
              >
                {form.email === selectedAdmin.email
                  ? "Current email address"
                  : emailValidation.isChecking
                    ? "Validating email..."
                    : emailValidation.message || "Valid email address required"}
              </p>
            </div>
          </div>

          {/* Password field with visibility toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-gray-900 dark:text-gray-900">
              New Password (optional)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  onChange({ ...form, password: e.target.value })
                }
                placeholder="Leave blank to keep current password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => onChange({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-900"
              >
                <option value={ROLE_ADMIN}>Admin</option>
                <option value={ROLE_SUPER_ADMIN}>Super Admin</option>
              </select>
            </div>
          </div>

          {/* Permissions list */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Permissions
            </label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
              {/* read-only list for both roles */}
<div className="space-y-2">
  {availablePermissions
    .filter(p =>
      form.role === ROLE_SUPER_ADMIN ||
      (form.role === ROLE_ADMIN && p.key !== "manage_admins")
    )
    .map(p => (
      <div
        key={p.key}
        className={`flex items-start p-2 rounded ${
          form.role === ROLE_SUPER_ADMIN ? "bg-purple-50" : "bg-gray-50"
        }`}
      >
        <CheckCircle
          className={`mt-1 h-4 w-4 flex-shrink-0 ${
            form.role === ROLE_SUPER_ADMIN
              ? "text-purple-600"
              : "text-green-600"
          }`}
        />
        <div className="ml-2 text-sm">
          <div className="font-medium text-gray-900">{p.label}</div>
          <div className="text-xs text-gray-500">{p.description}</div>
        </div>
      </div>
    ))}
  {form.role === ROLE_ADMIN && (
    <div className="flex items-start bg-red-50 p-2 rounded">
      <XCircle className="mt-1 h-4 w-4 text-red-600 flex-shrink-0" />
      <div className="ml-2 text-sm">
        <div className="font-medium text-gray-900">Manage Admins</div>
        <div className="text-xs text-red-500">
          Not available for regular admins
        </div>
      </div>
    </div>
  )}
</div>

              
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
