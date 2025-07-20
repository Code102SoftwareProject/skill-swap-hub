import React, { useEffect, useState, useMemo, useCallback } from "react";
import { debounce } from "lodash-es";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
//import { processAvatarUrl } from '@/utils/avatarUtils';
import { processAvatarUrl } from "@/utils/imageUtils";
import Image from "next/image";
import { UserRoundX } from "lucide-react";
// Types
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: string;
  suspension?: {
    isSuspended: boolean;
    suspendedAt?: string;
    reason?: string;
  };
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface UserTableProps {
  users: User[];
  onDelete: (userId: string) => void;
  onSuspend: (userId: string) => void;
  loading: boolean;
  sortBy: string;
  sortOrder: string;
  onSort: (field: string) => void;
}

interface UserCardProps {
  user: User;
  onDelete: (userId: string) => void;
  onSuspend: (userId: string) => void;
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
}

const DEBOUNCE_DELAY = 300;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];
const SORT_FIELDS = [
  { value: "createdAt", label: "Created At" },
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "title", label: "Title" },
  { value: "role", label: "Role" },
];
const SORT_ORDERS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

// Helper functions
const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
};

const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

// Components
const LoadingSkeleton: React.FC<{ count?: number }> = ({ count = 10 }) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className="animate-pulse flex items-center p-4 bg-white rounded-lg shadow"
      >
        <div className="w-10 h-10 bg-gray-200 rounded-full mr-4"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
      </div>
    ))}
  </div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="py-10 text-center text-red-500">
    <span className="inline-block mr-2">❌</span> {message}
  </div>
);

const EmptyState: React.FC = () => (
  <div className="py-10 text-center text-gray-400">
    <span className="inline-block mr-2">🕵️‍♂️</span> No users found.
  </div>
);

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
}) => (
  <div className="relative w-full sm:w-80">
    <input
      type="text"
      placeholder="Search by name, email, or title..."
      className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-all"
      onChange={(e) => onChange(e.target.value)}
      value={value}
      aria-label="Search users"
    />
    <svg
      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
    {value && (
      <button
        onClick={onClear}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
        aria-label="Clear search"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    )}
  </div>
);

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        Prev
      </button>
      {getPageNumbers().map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded-full text-sm ${
            currentPage === page
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
          }`}
          aria-current={currentPage === page ? "page" : undefined}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
};

const UserAvatar: React.FC<{ user: User; size?: "sm" | "md" | "lg" }> = ({
  user,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
  };
  const avatarSrc = processAvatarUrl(user.avatar) || "/default-avatar.png";
  return user.avatar ? (
    <Image
      src={avatarSrc}
      alt={`${user.firstName} ${user.lastName}'s avatar`}
      width={100} // This is fine; acts as a fallback size
      height={100}
      className={`rounded-full object-cover border ${sizeClasses[size]}`}
    />
  ) : (
    <div
      className={`rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border ${sizeClasses[size]}`}
    >
      {getInitials(user.firstName, user.lastName)}
    </div>
  );
};

const DeleteButton: React.FC<{ onClick: () => void; label: string }> = ({
  onClick,
  label,
}) => (
  <button
    onClick={onClick}
    className="p-2 rounded-full hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
    aria-label={label}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="#ef4444"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  </button>
);

const SuspendButton: React.FC<{
  onClick: () => void;
  label: string;
  isSuspended: boolean;
}> = ({ onClick, label, isSuspended }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 ${
      isSuspended
        ? "hover:bg-green-100 focus:ring-green-500"
        : "hover:bg-yellow-100 focus:ring-yellow-500"
    }`}
    aria-label={label}
  >
    {isSuspended ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="#10b981"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ) : (
      <UserRoundX className="w-6 h-6 text-yellow-500" />
    )}
  </button>
);

const UserCard: React.FC<UserCardProps> = ({ user, onDelete, onSuspend }) => (
  <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col sm:flex-row items-start gap-4 border border-gray-100 relative transition hover:shadow-lg focus-within:shadow-lg">
    <div className="flex-shrink-0 self-center sm:self-start mb-2 sm:mb-0">
      <UserAvatar user={user} size="lg" />
    </div>
    <div className="flex-1 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
          {user.firstName} {user.lastName}
        </h3>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <SuspendButton
            onClick={() => onSuspend(user._id)}
            label={`Suspend ${user.firstName} ${user.lastName}`}
            isSuspended={user.suspension?.isSuspended || false}
          />
          <DeleteButton
            onClick={() => onDelete(user._id)}
            label={`Delete ${user.firstName} ${user.lastName}`}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm text-gray-700">
        <div>
          <span className="font-medium text-gray-500">Email:</span>{" "}
          <span className="break-all">{user.email}</span>
        </div>
        <div>
          <span className="font-medium text-gray-500">Phone:</span>{" "}
          {formatPhoneNumber(user.phone)}
        </div>
        <div>
          <span className="font-medium text-gray-500">Title:</span> {user.title}
        </div>
        <div>
          <span className="font-medium text-gray-500">Joined:</span>{" "}
          {formatDate(user.createdAt)}
        </div>
      </div>
      {user.suspension?.isSuspended && (
        <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 rounded px-2 py-1 inline-block">
          Suspended: {user.suspension.reason || "No reason provided"}
        </div>
      )}
    </div>
  </div>
);

const UserTableRow: React.FC<{
  user: User;
  onDelete: (userId: string) => void;
  onSuspend: (userId: string) => void;
}> = ({ user, onDelete, onSuspend }) => (
  <tr className="hover:bg-gray-50 transition-colors border-b last:border-b-0">
    <td className="px-4 py-3 w-20 align-middle">
      <UserAvatar user={user} />
    </td>
    <td className="px-6 py-3 min-w-[140px] font-medium align-middle">
      {user.firstName} {user.lastName}
    </td>
    <td className="px-6 py-3 min-w-[200px] align-middle">{user.email}</td>
    <td className="px-6 py-3 min-w-[130px] align-middle">
      {formatPhoneNumber(user.phone)}
    </td>
    <td className="px-6 py-3 min-w-[120px] align-middle">{user.title}</td>
    <td className="px-6 py-3 min-w-[110px] align-middle">
      {formatDate(user.createdAt)}
    </td>
    <td className="px-6 py-3 w-32 align-middle text-center">
      <div className="flex gap-2 justify-center">
        <SuspendButton
          onClick={() => onSuspend(user._id)}
          label={`Suspend ${user.firstName} ${user.lastName}`}
          isSuspended={user.suspension?.isSuspended || false}
        />
        <DeleteButton
          onClick={() => onDelete(user._id)}
          label={`Delete ${user.firstName} ${user.lastName}`}
        />
      </div>
    </td>
  </tr>
);

const UserTable: React.FC<UserTableProps> = ({
  users,
  onDelete,
  onSuspend,
  loading,
}) => {
  if (loading) return <LoadingSkeleton />;
  if (users.length === 0) return <EmptyState />;
  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full text-gray-900 p-12">
        <thead className="bg-gradient-to-r from-blue-50 to-blue-100 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 w-20 text-left font-bold text-sm uppercase tracking-wider text-blue-800 border-b border-blue-200 bg-blue-50/80 align-middle">
              Avatar
            </th>
            <th className="px-6 py-3 min-w-[140px] text-left font-bold text-sm uppercase tracking-wider text-blue-800 border-b border-blue-200 bg-blue-50/80 align-middle">
              Name
            </th>
            <th className="px-6 py-3 min-w-[200px] text-left font-bold text-sm uppercase tracking-wider text-blue-800 border-b border-blue-200 bg-blue-50/80 align-middle">
              Email
            </th>
            <th className="px-6 py-3 min-w-[130px] text-left font-bold text-sm uppercase tracking-wider text-blue-800 border-b border-blue-200 bg-blue-50/80 align-middle">
              Phone
            </th>
            <th className="px-6 py-3 min-w-[120px] text-left font-bold text-sm uppercase tracking-wider text-blue-800 border-b border-blue-200 bg-blue-50/80 align-middle">
              Title
            </th>
            <th className="px-6 py-3 min-w-[110px] text-left font-bold text-sm uppercase tracking-wider text-blue-800 border-b border-blue-200 bg-blue-50/80 align-middle">
              Joined
            </th>
            <th className="px-6 py-3 w-32 text-center font-bold text-sm uppercase tracking-wider text-blue-800 border-b border-blue-200 bg-blue-50/80 align-middle">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserTableRow
              key={user._id}
              user={user}
              onDelete={onDelete}
              onSuspend={onSuspend}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Confirm Deletion
        </h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete{" "}
          {userName ? `user ${userName}` : "this user"}? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
            aria-label="Cancel deletion"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            aria-label="Confirm deletion"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Main UsersContent component
const UsersContent: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pageSize, setPageSize] = useState(10);

  // Fetch users from API with pagination, search, sorting, and page size
  const fetchUsers = useCallback(
    async (
      pageNum = 1,
      searchTerm = "",
      sortField = sortBy,
      sortDir = sortOrder,
      limit = pageSize
    ) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: limit.toString(),
          sortBy: sortField,
          sortOrder: sortDir,
        });
        if (searchTerm) params.append("search", searchTerm);
        const res = await fetch(`/api/User-managment?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data.users);
        setPagination(data.pagination);
        setSortBy(data.pagination.sortBy || sortBy);
        setSortOrder(data.pagination.sortOrder || sortOrder);
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        toast.error(error.message, { position: "top-right" });
      } finally {
        setLoading(false);
      }
    },
    [sortBy, sortOrder, pageSize]
  );

  // Initial and paginated fetch
  useEffect(() => {
    fetchUsers(page, search, sortBy, sortOrder, pageSize);
  }, [page, search, sortBy, sortOrder, pageSize, fetchUsers]);

  // Handle delete user
  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(
        `/api/User-managment?userId=${userToDelete._id}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("Failed to delete user");
      fetchUsers(page, search, sortBy, sortOrder, pageSize);
      toast.success(
        `User ${userToDelete.firstName} ${userToDelete.lastName} was soft deleted (hidden from list)`,
        {
          position: "top-right",
        }
      );
    } catch (err) {
      const error = err as Error;
      toast.error(error.message, { position: "top-right" });
    } finally {
      setShowModal(false);
      setUserToDelete(null);
    }
  };

  // Handle suspend user (only suspension, unsuspension is handled in SuspendedUsersContent)
  const handleSuspend = async (userId: string) => {
    const user = users.find((u) => u._id === userId);
    if (!user) return;

    const suspensionReason =
      prompt(
        `Are you sure you want to suspend ${user.firstName} ${user.lastName}?\n\nPlease provide a reason for suspension:`,
        "Policy violation"
      ) || "";

    if (!suspensionReason) return; // User cancelled

    const suspensionNotes =
      prompt(`Additional notes for the suspension (optional):`, "") || "";

    try {
      const res = await fetch(`/api/User-managment?userId=${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          suspended: true,
          suspensionReason: suspensionReason,
          suspensionNotes: suspensionNotes,
          adminId: "current-admin-id", // You might want to get this from context or token
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to suspend user");
      }

      // Remove the user from the current list since they're now suspended
      setUsers((prevUsers) => prevUsers.filter((u) => u._id !== userId));

      toast.success(
        `User ${user.firstName} ${user.lastName} has been suspended and moved to the Suspended Users list.`,
        { position: "top-right", autoClose: 5000 }
      );
    } catch (err) {
      const error = err as Error;
      toast.error(error.message, { position: "top-right" });
    }
  };

  // Debounced search
  const debouncedSearchHandler = useMemo(
    () =>
      debounce((value: string) => {
        setPage(1);
        setSearch(value);
      }, DEBOUNCE_DELAY),
    []
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      debouncedSearchHandler(value);
    },
    [debouncedSearchHandler]
  );

  const clearSearch = useCallback(() => {
    setSearch("");
    setPage(1);
    debouncedSearchHandler.cancel();
  }, [debouncedSearchHandler]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearchHandler.cancel();
    };
  }, [debouncedSearchHandler]);

  const handleDeleteClick = useCallback(
    (userId: string) => {
      const user = users.find((u) => u._id === userId);
      if (user) {
        setUserToDelete(user);
        setShowModal(true);
      }
    },
    [users]
  );

  // Sorting controls handlers
  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
    setPage(1);
  };
  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value);
    setPage(1);
  };
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };
  const handleTableSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  return (
    <div className="p-2 sm:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen mt-7">
      <ToastContainer />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#026aa1]">
            User Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {pagination.total} {pagination.total === 1 ? "user" : "users"} found
          </p>
        </div>
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          onClear={clearSearch}
        />
      </div>
      {/* Sorting & Page Size Controls */}
      <div className="mb-4 p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-stretch sm:items-center bg-white/80 rounded-xl shadow-sm px-4 py-3 border border-gray-200">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <span className="inline-flex items-center gap-1">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7h18M3 12h12M3 17h6"
                />
              </svg>
              Sort by:
            </span>
            <select
              className="border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition text-gray-900 bg-white hover:border-blue-400"
              value={sortBy}
              onChange={handleSortByChange}
            >
              {SORT_FIELDS.map((field) => (
                <option key={field.value} value={field.value}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <span className="inline-flex items-center gap-1">
              {sortOrder === "asc" ? (
                <svg
                  className="w-4 h-4 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
              Order:
            </span>
            <select
              className={`border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition text-gray-900 bg-white hover:border-blue-400 font-semibold `}
              value={sortOrder}
              onChange={handleSortOrderChange}
            >
              {SORT_ORDERS.map((order) => (
                <option key={order.value} value={order.value}>
                  {order.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <span className="inline-flex items-center gap-1">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M8 12h8M12 8v8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Page size:
            </span>
            <select
              className="border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition text-gray-900 bg-white hover:border-blue-400"
              value={pageSize}
              onChange={handlePageSizeChange}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {/* Content */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        {/* Desktop: Table */}
        <div className="hidden md:block">
          {error ? (
            <ErrorMessage message={error} />
          ) : (
            <UserTable
              users={users}
              onDelete={handleDeleteClick}
              onSuspend={handleSuspend}
              loading={loading}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleTableSort}
            />
          )}
        </div>
        {/* Mobile: Cards */}
        <div className="md:hidden flex flex-col gap-4 p-2 sm:p-4">
          {loading ? (
            <LoadingSkeleton count={5} />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : users.length === 0 ? (
            <EmptyState />
          ) : (
            users.map((user) => (
              <UserCard
                key={user._id}
                user={user}
                onDelete={handleDeleteClick}
                onSuspend={handleSuspend}
              />
            ))
          )}
        </div>
      </div>
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        userName={
          userToDelete
            ? `${userToDelete.firstName} ${userToDelete.lastName}`
            : undefined
        }
      />
    </div>
  );
};

export default UsersContent;
