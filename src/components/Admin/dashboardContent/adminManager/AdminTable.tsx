"use client";

// ─── TOP-LEVEL CONSTANTS ──────────────────────────────────────────────────────
// Role identifier for Super Admin checks
const ROLE_SUPER_ADMIN = "super_admin";

// ─── IMPORTS ──────────────────────────────────────────────────────────────────
import { Edit, Shield, ShieldCheck, Trash2 } from "lucide-react";

// ─── TYPE DEFINITIONS ─────────────────────────────────────────────────────────
// Represents an administrator account
interface Admin {
  _id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  createdAt: string;
  createdBy?: { username: string };
}

// Represents a single permission option
interface Permission {
  key: string;
  label: string;
  description: string;
}

// Props accepted by the AdminTable component
interface AdminTableProps {
  admins: Admin[];
  availablePermissions: Permission[];
  onEdit: (admin: Admin) => void;
  onDelete: (id: string) => void;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function AdminTable({
  admins,
  availablePermissions,
  onEdit,
  onDelete,
}: AdminTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Responsive wrapper for horizontal scrolling */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table headings */}
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Admin Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
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
          {/* Table body with data rows */}
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map(admin => (
              <tr key={admin._id} className="hover:bg-gray-50">
                {/* Username and email column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {admin.username}
                    </div>
                    <div className="text-sm text-gray-500">{admin.email}</div>
                  </div>
                </td>

                {/* Role column with icon */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {admin.role === ROLE_SUPER_ADMIN ? (
                      <ShieldCheck className="text-purple-600" size={20} />
                    ) : (
                      <Shield className="text-blue-600" size={20} />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        admin.role === ROLE_SUPER_ADMIN
                          ? "text-purple-600"
                          : "text-blue-600"
                      }`}
                    >
                      {admin.role === ROLE_SUPER_ADMIN ? "Super Admin" : "Admin"}
                    </span>
                  </div>
                </td>

                {/* Permissions column: show first 3 with “+N more” */}
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {admin.permissions.slice(0, 3).map(permissionKey => (
                      <span
                        key={permissionKey}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {
                          availablePermissions.find(p => p.key === permissionKey)
                            ?.label || permissionKey
                        }
                      </span>
                    ))}
                    {admin.permissions.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        +{admin.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </td>

                {/* Created date and creator */}
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

                {/* Action buttons for edit and delete */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(admin)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(admin._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Fallback row when there are no admins */}
            {admins.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No admins found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
