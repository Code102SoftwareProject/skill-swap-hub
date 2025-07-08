"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

// Define interfaces
interface Admin {
  _id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  status: string;
  createdAt: string;
  createdBy?: {
    username: string;
  };
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
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  permissions?: string[];
  status?: string;
}

// Available permissions
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
    key: "view_dashboard",
    label: "View Dashboard",
    description: "Access to dashboard overview",
  },
];

// Toast notification component
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "warning";
  onClose: () => void;
}) => {
  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
        ? "bg-red-500"
        : "bg-yellow-500";
  const icon =
    type === "success" ? (
      <CheckCircle size={20} />
    ) : type === "error" ? (
      <XCircle size={20} />
    ) : (
      <AlertCircle size={20} />
    );

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`${bgColor} text-white p-4 rounded-lg shadow-lg flex items-center space-x-2 mb-4`}
    >
      {icon}
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-auto text-white hover:text-gray-200"
      >
        <XCircle size={18} />
      </button>
    </div>
  );
};

interface AdminManagementContentProps {
  currentAdminRole?: string;
}

const AdminManagementContent: React.FC<AdminManagementContentProps> = ({
  currentAdminRole,
}) => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  // Check if current admin is a super admin
  const isCurrentSuperAdmin = currentAdminRole === "super_admin";

  // Form states
  const [createForm, setCreateForm] = useState<CreateAdminData>({
    username: "",
    email: "",
    password: "",
    role: "admin",
    permissions: [],
  });

  const [updateForm, setUpdateForm] = useState<UpdateAdminData>({
    adminId: "",
    username: "",
    email: "",
    password: "",
    role: "",
    permissions: [],
    status: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  // Fetch all admins
  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/admin/create-admin", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch admins");
      }

      const data = await response.json();
      setAdmins(data.admins || []);
    } catch (error) {
      console.error("Error fetching admins:", error);
      setToast({ message: "Failed to load admins", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Create new admin
  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (createForm.username.trim().length < 4) {
      setToast({
        message: "Username must be at least 4 characters long",
        type: "error",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createForm.email.trim())) {
      setToast({
        message: "Please enter a valid email address",
        type: "error",
      });
      return;
    }

    if (createForm.password.length < 8) {
      setToast({
        message: "Password must be at least 8 characters long",
        type: "error",
      });
      return;
    }

    const passwordRegex = /^(?=.*\d)/;
    if (!passwordRegex.test(createForm.password)) {
      setToast({
        message: "Password must contain at least one number",
        type: "error",
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(createForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create admin");
      }

      setToast({ message: "New admin created", type: "success" });
      setShowCreateForm(false);
      setCreateForm({
        username: "",
        email: "",
        password: "",
        role: "admin",
        permissions: [],
      });
      fetchAdmins();
    } catch (error: any) {
      console.error("Error creating admin:", error);
      setToast({
        message: error.message || "Failed to create admin",
        type: "error",
      });
    }
  };

  // Update admin
  const updateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/admin/manage-admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update admin");
      }

      setToast({ message: "Admin updated successfully", type: "success" });
      setShowEditForm(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (error: any) {
      console.error("Error updating admin:", error);
      setToast({
        message: error.message || "Failed to update admin",
        type: "error",
      });
    }
  };

  // Delete admin
  const deleteAdmin = async (adminId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this admin? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/manage-admin?id=${adminId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete admin");
      }

      setToast({ message: "Admin deleted successfully", type: "success" });
      fetchAdmins();
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      setToast({
        message: error.message || "Failed to delete admin",
        type: "error",
      });
    }
  };

  // Handle edit form
  const handleEdit = (admin: Admin) => {
    setSelectedAdmin(admin);
    setUpdateForm({
      adminId: admin._id,
      username: admin.username,
      email: admin.email,
      password: "",
      role: admin.role,
      permissions: admin.permissions,
      status: admin.status,
    });
    setShowEditForm(true);
  };

  // Handle permission toggle
  const togglePermission = (permission: string, isCreate: boolean = false) => {
    if (isCreate) {
      const newPermissions = createForm.permissions.includes(permission)
        ? createForm.permissions.filter((p) => p !== permission)
        : [...createForm.permissions, permission];
      setCreateForm({ ...createForm, permissions: newPermissions });
    } else {
      const newPermissions = updateForm.permissions!.includes(permission)
        ? updateForm.permissions!.filter((p) => p !== permission)
        : [...updateForm.permissions!, permission];
      setUpdateForm({ ...updateForm, permissions: newPermissions });
    }
  };

  // Set default permissions based on role
  const setDefaultPermissions = (role: string, isCreate: boolean = false) => {
    const defaultPermissions =
      role === "super_admin"
        ? AVAILABLE_PERMISSIONS.map((p) => p.key)
        : AVAILABLE_PERMISSIONS.filter((p) => p.key !== "manage_admins").map(
            (p) => p.key
          );

    if (isCreate) {
      setCreateForm({ ...createForm, role, permissions: defaultPermissions });
    } else {
      setUpdateForm({ ...updateForm, role, permissions: defaultPermissions });
    }
  };

  // Filter admins
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.username
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || admin.role === filterRole;
    const matchesStatus =
      filterStatus === "all" || admin.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchAdmins();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading admins...</span>
      </div>
    );
  }

  // Show unauthorized message if user is not a super admin
  if (!isCurrentSuperAdmin) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ShieldCheck className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Unauthorized
            </h2>
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
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="mr-2 text-blue-600" />
            Admin Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage administrator accounts and permissions
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Admin</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Admins List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role & Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium">No admins found</p>
                    <p className="text-sm">
                      Try adjusting your search or filter criteria
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {admin.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {admin.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {admin.role === "super_admin" ? (
                          <ShieldCheck className="text-purple-600" size={20} />
                        ) : (
                          <Shield className="text-blue-600" size={20} />
                        )}
                        <div>
                          <div
                            className={`text-sm font-medium ${admin.role === "super_admin" ? "text-purple-600" : "text-blue-600"}`}
                          >
                            {admin.role === "super_admin"
                              ? "Super Admin"
                              : "Admin"}
                          </div>
                          <div
                            className={`text-xs px-2 py-1 rounded-full ${
                              admin.status === "active"
                                ? "bg-green-100 text-green-800"
                                : admin.status === "inactive"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {admin.status.charAt(0).toUpperCase() +
                              admin.status.slice(1)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {admin.permissions.slice(0, 3).map((permission) => (
                          <span
                            key={permission}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {AVAILABLE_PERMISSIONS.find(
                              (p) => p.key === permission
                            )?.label || permission}
                          </span>
                        ))}
                        {admin.permissions.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{admin.permissions.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </div>
                        {admin.createdBy && (
                          <div className="text-xs text-gray-400">
                            by {admin.createdBy.username}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(admin)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteAdmin(admin._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Admin</h2>
            <form onSubmit={createAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, username: e.target.value })
                    }
                    placeholder="At least 4 characters"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    minLength={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 4 characters
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, email: e.target.value })
                    }
                    placeholder="admin@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valid email address
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, password: e.target.value })
                    }
                    placeholder="At least 8 characters with a number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 8 characters including at least one number
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setDefaultPermissions(e.target.value, true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions Summary (Read-only)
                </label>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {AVAILABLE_PERMISSIONS.map((permission) => {
                      const isChecked = createForm.permissions.includes(
                        permission.key
                      );
                      return (
                        <div
                          key={permission.key}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            id={`create-${permission.key}`}
                            checked={isChecked}
                            disabled={true}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-gray-100 cursor-not-allowed"
                          />
                          <label
                            htmlFor={`create-${permission.key}`}
                            className={`text-sm ${isChecked ? "text-gray-700" : "text-gray-400"}`}
                          >
                            {permission.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {createForm.role === "super_admin"
                      ? "Super Admins have all permissions including admin management."
                      : "Regular Admins have all permissions except admin management."}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
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
      )}

      {/* Edit Admin Modal */}
      {showEditForm && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Edit Admin: {selectedAdmin.username}
            </h2>
            <form onSubmit={updateAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={updateForm.username}
                    onChange={(e) =>
                      setUpdateForm({ ...updateForm, username: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={updateForm.email}
                    onChange={(e) =>
                      setUpdateForm({ ...updateForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password (leave blank to keep current)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={updateForm.password}
                    onChange={(e) =>
                      setUpdateForm({ ...updateForm, password: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={updateForm.role}
                    onChange={(e) =>
                      setDefaultPermissions(e.target.value, false)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={updateForm.status}
                    onChange={(e) =>
                      setUpdateForm({ ...updateForm, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions Summary (Read-only)
                </label>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {AVAILABLE_PERMISSIONS.map((permission) => {
                      const isChecked = updateForm.permissions!.includes(
                        permission.key
                      );
                      return (
                        <div
                          key={permission.key}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            id={`update-${permission.key}`}
                            checked={isChecked}
                            disabled={true}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-gray-100 cursor-not-allowed"
                          />
                          <label
                            htmlFor={`update-${permission.key}`}
                            className={`text-sm ${isChecked ? "text-gray-700" : "text-gray-400"}`}
                          >
                            {permission.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {updateForm.role === "super_admin"
                      ? "Super Admins have all permissions including admin management."
                      : "Regular Admins have all permissions except admin management."}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagementContent;
