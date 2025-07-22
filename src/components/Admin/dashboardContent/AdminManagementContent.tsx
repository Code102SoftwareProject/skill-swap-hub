"use client";

// ─── TOP-LEVEL CONSTANTS (no magic strings) ────────────────────────────────────

// API endpoints
const API_CREATE_ADMIN = "/api/admin/create-admin";
const API_MANAGE_ADMIN = "/api/admin/manage-admin";

// Role identifiers
const ROLE_SUPER_ADMIN = "super_admin";
const ROLE_ADMIN = "admin";
const ROLE_ALL = "all";

// Confirmation prompts
const CONFIRM_DELETE_ADMIN_MESSAGE =
  "Are you sure you want to delete this admin? This action cannot be undone.";

// ─── IMPORTS ──────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import Toast, { ToastType } from "./adminManager/Toast";
import AdminFilters from "./adminManager/AdminFilters";
import AdminTable from "./adminManager/AdminTable";
import AdminCreateModal from "./adminManager/AdminCreateModal";
import AdminEditModal from "./adminManager/AdminEditModal";
import { Plus, Shield, ShieldCheck } from "lucide-react";

// ─── DATA SHAPES ──────────────────────────────────────────────────────────────
// TypeScript interfaces to enforce structure of our data
interface Admin {
  _id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  createdAt: string;
  createdBy?: { username: string };
}

interface CreateAdminData {
  username: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
}

interface UpdateAdminData {
  adminId: string;
  username: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
}

interface EmailValidation {
  isValid: boolean;
  message: string;
  isChecking: boolean;
}

interface AdminManagementContentProps {
  currentAdminRole?: string;
}

// ─── PERMISSIONS LIST ─────────────────────────────────────────────────────────
// Central list of all assignable permissions
const AVAILABLE_PERMISSIONS = [
  {
    key: "manage_admins",
    label: "Manage Admins",
    description: "Create, update, and delete admin accounts",
  },
  {
    key: "manage_users",
    label: "Manage Users",
    description: "Manage user accounts and profiles",
  },
  {
    key: "manage_kyc",
    label: "Manage KYC",
    description: "Handle KYC verification processes",
  },
  {
    key: "manage_suggestions",
    label: "Manage Suggestions",
    description: "Review and manage user suggestions",
  },
  {
    key: "manage_system",
    label: "Manage System",
    description: "System configuration and settings",
  },
  {
    key: "manage_suspended_users",
    label: "Manage Suspended Users",
    description: "View, suspend or reactivate user accounts",
  },
  {
    key: "manage_verification",
    label: "Manage Verification",
    description: "Handle document verification",
  },
  {
    key: "manage_reporting",
    label: "Manage Reporting",
    description: "Access to reporting and analytics",
  },
  {
    key: "manage_forum_reports",
    label: "Manage Forum Reports",
    description: "Review and moderate forum post reports",
  },
  {
    key: "manage_success_stories",
    label: "Manage Success Stories",
    description: "Create, edit, and delete success stories",
  },
  {
    key: "view_dashboard",
    label: "View Dashboard",
    description: "Access to dashboard overview",
  },
    {
      key: "manage_inbox",
      label: "Manage Inbox",
      description: "View and respond to contact-form submissions",
    },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function AdminManagementContent({
  currentAdminRole,
}: AdminManagementContentProps) {
  // ─── STATE HOOKS ────────────────────────────────────────────────────────────
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  const [createForm, setCreateForm] = useState<CreateAdminData>({
    username: "",
    email: "",
    password: "",
    role: ROLE_ADMIN,
    permissions: [],
  });

  const [updateForm, setUpdateForm] = useState<UpdateAdminData>({
    adminId: "",
    username: "",
    email: "",
    password: "",
    role: ROLE_ADMIN,
    permissions: [],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState(ROLE_ALL);
  const [showPassword, setShowPassword] = useState(false);

  // For displaying temporary feedback to the user
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(
    null
  );

  // Email validation states for create vs. update flows
  const [emailValidation, setEmailValidation] = useState<EmailValidation>({
    isValid: false,
    message: "",
    isChecking: false,
  });
  const [updateEmailValidation, setUpdateEmailValidation] =
    useState<EmailValidation>({
      isValid: false,
      message: "",
      isChecking: false,
    });

  // Debounced search term to avoid rapid filtering on every keystroke
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Shortcut boolean for super‐admin checks
  const isCurrentSuperAdmin = currentAdminRole === ROLE_SUPER_ADMIN;

  // ─── DATA FETCHING ───────────────────────────────────────────────────────────
  const fetchAdmins = async () => {
    try {
      const response = await fetch(API_CREATE_ADMIN, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch admins");
      const data = await response.json();
      setAdmins(data.admins || []);
    } catch {
      setToast({ message: "Failed to load admins", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ─── EMAIL VALIDATION HELPERS ────────────────────────────────────────────────
  const validateEmailFormat = (email: string) => {
    if (!email.trim()) return { isValid: false, message: "Email is required" };
    if (email.length > 254)
      return { isValid: false, message: "Email is too long (max 254 characters)" };

    // Standard RFC-compatible regex
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email.trim()))
      return { isValid: false, message: "Please enter a valid email address" };

    const domain = email.split("@")[1] || "";
    if (!domain.includes("."))
      return {
        isValid: false,
        message: "Email domain must contain a valid extension",
      };
    if (domain.length > 253)
      return { isValid: false, message: "Email domain is too long" };

    return { isValid: true, message: "Email format is valid" };
  };

  const checkEmailUniqueness = async (
    email: string,
    excludeAdminId?: string
  ) => {
    try {
      const existing = admins.find(
        (a) =>
          a.email.toLowerCase() === email.toLowerCase() &&
          a._id !== excludeAdminId
      );
      if (existing)
        return { isUnique: false, message: "This email is already used by another admin" };
      return { isUnique: true, message: "Email is available" };
    } catch {
      return { isUnique: false, message: "Unable to verify email uniqueness" };
    }
  };

  // ─── CREATE / UPDATE EMAIL VALIDATION FLOWS ─────────────────────────────────
  const validateEmailForCreate = async (email: string) => {
    setEmailValidation({ isValid: false, message: "", isChecking: true });
    const formatCheck = validateEmailFormat(email);
    if (!formatCheck.isValid) {
      setEmailValidation({ ...formatCheck, isChecking: false });
      return;
    }
    const uniquenessCheck = await checkEmailUniqueness(email);
    setEmailValidation({ isValid: uniquenessCheck.isUnique, message: uniquenessCheck.message, isChecking: false });
  };

  const validateEmailForUpdate = async (email: string, adminId: string) => {
    setUpdateEmailValidation({ isValid: false, message: "", isChecking: true });
    const formatCheck = validateEmailFormat(email);
    if (!formatCheck.isValid) {
      setUpdateEmailValidation({ ...formatCheck, isChecking: false });
      return;
    }
    const uniquenessCheck = await checkEmailUniqueness(email, adminId);
    setUpdateEmailValidation({
      isValid: uniquenessCheck.isUnique,
      message: uniquenessCheck.message,
      isChecking: false,
    });
  };

  // ─── CRUD OPERATIONS ─────────────────────────────────────────────────────────
  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(API_CREATE_ADMIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(createForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create admin");
      setToast({ message: "New admin created successfully", type: "success" });
      setShowCreateForm(false);
      setCreateForm({ username: "", email: "", password: "", role: ROLE_ADMIN, permissions: [] });
      setEmailValidation({ isValid: false, message: "", isChecking: false });
      fetchAdmins();
    } catch (error: any) {
      setToast({ message: error.message || "Failed to create admin", type: "error" });
    }
  };

  const updateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(API_MANAGE_ADMIN, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update admin");
      setToast({ message: "Admin updated successfully", type: "success" });
      setShowEditForm(false);
      setSelectedAdmin(null);
      setUpdateEmailValidation({ isValid: false, message: "", isChecking: false });
      fetchAdmins();
    } catch (error: any) {
      setToast({ message: error.message || "Failed to update admin", type: "error" });
    }
  };

  const deleteAdmin = async (adminId: string) => {
    // Ask user for confirmation before destructive action
    if (!confirm(CONFIRM_DELETE_ADMIN_MESSAGE)) return;

    try {
      const response = await fetch(`${API_MANAGE_ADMIN}?id=${adminId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete admin");
      setToast({ message: "Admin deleted successfully", type: "success" });
      fetchAdmins();
    } catch (error: any) {
      setToast({ message: error.message || "Failed to delete admin", type: "error" });
    }
  };

  // ─── HANDLERS & HELPERS ─────────────────────────────────────────────────────
  const handleEdit = (admin: Admin) => {
    setSelectedAdmin(admin);
    setUpdateForm({
      adminId: admin._id,
      username: admin.username,
      email: admin.email,
      password: "",
      role: admin.role,
      permissions: admin.permissions,
    });
    setUpdateEmailValidation({ isValid: false, message: "", isChecking: false });
    setShowEditForm(true);
  };

  // Toggle a permission on create vs update forms
  const togglePermission = (permission: string, isCreate = false) => {
    const form = isCreate ? createForm : updateForm;
    const has = form.permissions.includes(permission);
    const newPerms = has
      ? form.permissions.filter((p) => p !== permission)
      : [...form.permissions, permission];

    if (isCreate) setCreateForm({ ...createForm, permissions: newPerms });
    else setUpdateForm({ ...updateForm, permissions: newPerms });
  };

  // Auto-assign default permissions based on selected role
  const setDefaultPermissions = (role: string, isCreate = false) => {
    const defaultKeys =
      role === ROLE_SUPER_ADMIN
        ? AVAILABLE_PERMISSIONS.map((p) => p.key)
        : AVAILABLE_PERMISSIONS.filter((p) => p.key !== "manage_admins").map((p) => p.key);

    if (isCreate) setCreateForm({ ...createForm, role, permissions: defaultKeys });
    else setUpdateForm({ ...updateForm, role, permissions: defaultKeys });
  };

  // ─── FILTERED & DEBOUNCED SEARCH ─────────────────────────────────────────────
  const filteredAdmins = admins.filter((admin) => {
    const text = debouncedSearchTerm.toLowerCase();
    const matchesSearch =
      admin.username.toLowerCase().includes(text) ||
      admin.email.toLowerCase().includes(text);
    const matchesRole = filterRole === ROLE_ALL || admin.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Debounce search input for smoother typing UX
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Validate email on create form with a slight delay
  useEffect(() => {
    if (createForm.email.trim()) {
      const timer = setTimeout(() => validateEmailForCreate(createForm.email.trim()), 500);
      return () => clearTimeout(timer);
    }
    setEmailValidation({ isValid: false, message: "", isChecking: false });
  }, [createForm.email]);

  // Validate email on update form when email or id changes
  useEffect(() => {
    if (updateForm.email && updateForm.adminId) {
      const timer = setTimeout(() => validateEmailForUpdate(updateForm.email.trim(), updateForm.adminId), 500);
      return () => clearTimeout(timer);
    }
    setUpdateEmailValidation({ isValid: false, message: "", isChecking: false });
  }, [updateForm.email, updateForm.adminId]);

  // Initial data load
  useEffect(() => {
    fetchAdmins();
  }, []);

  // Reset create permissions whenever role changes
  useEffect(() => {
    setDefaultPermissions(createForm.role, true);
  }, [createForm.role]);

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  if (loading) {
    // Show spinner while fetching
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading admins...</span>
      </div>
    );
  }

  if (!isCurrentSuperAdmin) {
    // Restrict access for non-super admins
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ShieldCheck className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access admin management.
            </p>
            <p className="text-sm text-gray-500">
              Only Super Admins can view and manage administrator accounts.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Toast notifications */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Header and Create button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="mr-2 text-blue-600" />
            Admin Management
          </h1>
          <p className="text-gray-600 mt-1">Manage administrator accounts and permissions</p>
        </div>
        <button
          onClick={() => {
            setDefaultPermissions(ROLE_ADMIN, true);
            setShowCreateForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Admin</span>
        </button>
      </div>

      {/* Filters and table */}
      <AdminFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterRole={filterRole}
        onRoleChange={setFilterRole}
      />
      <AdminTable
        admins={filteredAdmins}
        availablePermissions={AVAILABLE_PERMISSIONS}
        onEdit={handleEdit}
        onDelete={deleteAdmin}
      />

      {/* Create and Edit modals */}
      {showCreateForm && (
        <AdminCreateModal
          form={createForm}
          onChange={setCreateForm}
          onSubmit={createAdmin}
          onClose={() => setShowCreateForm(false)}
          availablePermissions={AVAILABLE_PERMISSIONS}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />
      )}
      {showEditForm && selectedAdmin && (
        <AdminEditModal
          selectedAdmin={{
            adminId: selectedAdmin._id,
            username: selectedAdmin.username,
            email: selectedAdmin.email,
            password: "",
            role: selectedAdmin.role,
            permissions: selectedAdmin.permissions,
          }}
          form={updateForm}
          onChange={setUpdateForm}
          onSubmit={updateAdmin}
          onClose={() => setShowEditForm(false)}
          emailValidation={updateEmailValidation}
          availablePermissions={AVAILABLE_PERMISSIONS}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />
      )}
    </div>
  );
}
