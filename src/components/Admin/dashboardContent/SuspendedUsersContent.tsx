"use client";

// ─── TOP-LEVEL CONSTANTS ─────────────────────────────────────────────────────
// Number of users to show per page
const USERS_PER_PAGE = 10;
// Delay for debounced search (milliseconds)
const DEBOUNCE_DELAY = 300;

import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { debounce } from "lodash-es";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ─── TYPE DEFINITIONS ─────────────────────────────────────────────────────────
interface SuspendedUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  title?: string;
  avatar?: string;
  originalCreatedAt?: string;
  suspendedAt?: string;
  suspensionReason?: string;
  suspensionNotes?: string;
  originalUserId?: string;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface SuspendedUserTableProps {
  users: SuspendedUser[];
  onUnsuspend: (userId: string) => void;
  onDelete: (userId: string) => void;
  loading: boolean;
}

interface SuspendedUserCardProps {
  user: SuspendedUser;
  onUnsuspend: (userId: string) => void;
  onDelete: (userId: string) => void;
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

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────
// Get initials from first and last name
const getInitials = (first: string, last: string): string =>
  `${(first[0] || "").toUpperCase()}${(last[0] || "").toUpperCase()}`;

// Format a 10-digit phone number as (123) 456-7890
const formatPhoneNumber = (phone: string): string =>
  phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");

// Convert ISO date string to locale date
const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString();

// Convert ISO date string to locale date and time
const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString();

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────

// Skeleton loader while data is fetching
const LoadingSkeleton: React.FC<{ count?: number }> = ({ count = USERS_PER_PAGE }) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className="animate-pulse flex items-center p-4 bg-white rounded-lg shadow"
      >
        <div className="w-10 h-10 bg-gray-200 rounded-full mr-4" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="w-6 h-6 bg-gray-200 rounded-full" />
      </div>
    ))}
  </div>
);

// Error message display
const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="py-10 text-center text-red-600">
    {message}
  </div>
);

// Empty state when no suspended users
const EmptyState: React.FC = () => (
  <div className="py-10 text-center text-gray-500">
    No suspended users found.
  </div>
);

// Search input with clear button
const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, onClear }) => (
  <div className="relative w-full sm:w-80">
    <input
      type="text"
      placeholder="Search by name, email, or reason..."
      className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 transition"
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label="Search suspended users"
    />
    <svg
      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
);

// Pagination controls with previous/next and page numbers
const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded-full bg-gray-100 disabled:opacity-50"
        aria-label="Previous page"
      >
        Prev
      </button>
      {getPageNumbers().map(page => (
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
        className="px-3 py-1 rounded-full bg-gray-100 disabled:opacity-50"
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
};

// User avatar or initials placeholder
const UserAvatar: React.FC<{ user: SuspendedUser; size?: "sm" | "md" | "lg" }> = ({
  user,
  size = "md",
}) => {
  const classes = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
  }[size];

  return user.avatar ? (
    <img
      src={user.avatar}
      alt="User avatar"
      className={`rounded-full object-cover border ${classes}`}
    />
  ) : (
    <div className={`rounded-full bg-gray-200 flex items-center justify-center ${classes}`}>
      {getInitials(user.firstName || "", user.lastName || "")}
    </div>
  );
};

// Button to unsuspend
const UnsuspendButton: React.FC<{ onClick: () => void; label: string }> = ({
  onClick,
  label,
}) => (
  <button
    onClick={onClick}
    className="p-2 rounded-full hover:bg-green-100 focus:ring-2 focus:ring-green-500"
    aria-label={label}
  >
    ✓
  </button>
);

// Button to delete permanently
const DeleteButton: React.FC<{ onClick: () => void; label: string }> = ({
  onClick,
  label,
}) => (
  <button
    onClick={onClick}
    className="p-2 rounded-full hover:bg-red-100 focus:ring-2 focus:ring-red-500"
    aria-label={label}
  >
    ✕
  </button>
);

// Card layout for mobile view
const SuspendedUserCard: React.FC<SuspendedUserCardProps> = ({
  user,
  onUnsuspend,
  onDelete,
}) => (
  <div className="bg-white rounded-lg shadow p-4 flex items-start gap-4 border-l-4 border-red-600">
    <UserAvatar user={user} size="lg" />
    <div className="flex-1">
      <h3 className="font-medium text-gray-900">
        {user.firstName || "Unknown"} {user.lastName || ""}
        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
          Suspended
        </span>
      </h3>
      <p className="text-sm text-gray-600">
        <strong>Email:</strong> {user.email || "N/A"}
      </p>
      <p className="text-sm text-gray-600">
        <strong>Phone:</strong> {user.phone ? formatPhoneNumber(user.phone) : "N/A"}
      </p>
      <p className="text-sm text-gray-600">
        <strong>Reason:</strong> {user.suspensionReason || "N/A"}
      </p>
      <p className="text-sm text-gray-500">
        <strong>Suspended at:</strong> {user.suspendedAt ? formatDateTime(user.suspendedAt) : "N/A"}
      </p>
    </div>
    <div className="flex flex-col gap-2">
      <UnsuspendButton
        onClick={() => onUnsuspend(user._id)}
        label="Unsuspend user"
      />
      <DeleteButton
        onClick={() => onDelete(user._id)}
        label="Delete user"
      />
    </div>
  </div>
);

// Table row for desktop view
const SuspendedUserTableRow: React.FC<{
  user: SuspendedUser;
  onUnsuspend: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ user, onUnsuspend, onDelete }) => (
  <tr className="hover:bg-gray-50 border-b last:border-b-0">
    <td className="px-4 py-3">
      <UserAvatar user={user} />
    </td>
    <td className="px-4 py-3 font-medium">
      {user.firstName || ""} {user.lastName || ""}
      <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
        Suspended
      </span>
    </td>
    <td className="px-4 py-3">{user.email || "N/A"}</td>
    <td className="px-4 py-3">{user.phone ? formatPhoneNumber(user.phone) : "N/A"}</td>
    <td className="px-4 py-3">{user.title || "N/A"}</td>
    <td className="px-4 py-3">{user.suspensionReason || "N/A"}</td>
    <td className="px-4 py-3">{user.originalCreatedAt ? formatDate(user.originalCreatedAt) : "N/A"}</td>
    <td className="px-4 py-3">{user.suspendedAt ? formatDateTime(user.suspendedAt) : "N/A"}</td>
    <td className="px-4 py-3 flex gap-2">
      <UnsuspendButton onClick={() => onUnsuspend(user._id)} label="Unsuspend" />
      <DeleteButton onClick={() => onDelete(user._id)} label="Delete" />
    </td>
  </tr>
);

// Table layout for desktop
const SuspendedUserTable: React.FC<SuspendedUserTableProps> = ({
  users,
  onUnsuspend,
  onDelete,
  loading,
}) => {
  if (loading) return <LoadingSkeleton />;
  if (users.length === 0) return <EmptyState />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-gray-900">
        <thead className="bg-gray-100 sticky top-0">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold">Avatar</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Reason</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Joined</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Suspended</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <SuspendedUserTableRow
              key={user._id}
              user={user}
              onUnsuspend={onUnsuspend}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Delete confirmation modal
const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">
          Confirm Permanent Deletion
        </h3>
        <p className="text-gray-600 mb-6">
          Permanently delete {userName || "this user"}? This cannot be undone.
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const SuspendedUsersContent: React.FC = () => {
  const [users, setUsers] = useState<SuspendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [toDelete, setToDelete] = useState<SuspendedUser | null>(null);

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/suspended-users");
        if (!res.ok) throw new Error("Failed to fetch suspended users");
        const data = await res.json();
        setUsers(data.data || []);
      } catch (err) {
        setError((err as Error).message);
        toast.error((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Unsuspend handler
  const handleUnsuspend = async (id: string) => {
    const user = users.find(u => u._id === id);
    if (!user) return;
    if (!confirm(`Unsuspend ${user.firstName} ${user.lastName}?`)) return;
    try {
      const res = await fetch(`/api/suspended-users?userId=${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to unsuspend");
      setUsers(prev => prev.filter(u => u._id !== id));
      toast.success("User unsuspended");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await fetch(`/api/suspended-users?userId=${toDelete._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setUsers(prev => prev.filter(u => u._id !== toDelete._id));
      toast.success("User deleted");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setShowModal(false);
      setToDelete(null);
    }
  };

  // Open delete modal
  const requestDelete = useCallback(
    (id: string) => {
      const user = users.find(u => u._id === id);
      if (user) {
        setToDelete(user);
        setShowModal(true);
      }
    },
    [users]
  );

  // Debounced search setup
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearch(value.toLowerCase());
        setPage(1);
      }, DEBOUNCE_DELAY),
    []
  );

  const handleSearchChange = useCallback(
    (value: string) => debouncedSearch(value),
    [debouncedSearch]
  );

  const clearSearch = useCallback(() => {
    debouncedSearch.cancel();
    setSearch("");
    setPage(1);
  }, [debouncedSearch]);

  // Filter and paginate users
  const filtered = useMemo(
    () =>
      users.filter(u =>
        [u.firstName, u.lastName, u.email, u.title, u.suspensionReason]
          .join(" ")
          .toLowerCase()
          .includes(search)
      ),
    [users, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / USERS_PER_PAGE));

  const paginated = useMemo(
    () => filtered.slice((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE),
    [filtered, page]
  );

  // Reset page if out of range
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  // Clean up debounce on unmount
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen mt-7">
      <ToastContainer />

      {/* Header with count and search */}
      <div className="flex flex-col sm:flex-row sm:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-blue-800">Suspended Users</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filtered.length} user{filtered.length !== 1 && "s"} found
          </p>
        </div>
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          onClear={clearSearch}
        />
      </div>

      {/* Content area */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block">
          {error ? (
            <ErrorMessage message={error} />
          ) : (
            <SuspendedUserTable
              users={paginated}
              onUnsuspend={handleUnsuspend}
              onDelete={requestDelete}
              loading={loading}
            />
          )}
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-4 p-4">
          {loading ? (
            <LoadingSkeleton count={5} />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : paginated.length === 0 ? (
            <EmptyState />
          ) : (
            paginated.map(user => (
              <SuspendedUserCard
                key={user._id}
                user={user}
                onUnsuspend={handleUnsuspend}
                onDelete={requestDelete}
              />
            ))
          )}
        </div>
      </div>

      {/* Pagination controls */}
      {filtered.length > USERS_PER_PAGE && (
        <div className="flex justify-center mt-8">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Delete confirmation modal */}
      <DeleteModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        userName={
          toDelete ? `${toDelete.firstName} ${toDelete.lastName}` : undefined
        }
      />
    </div>
  );
};

export default SuspendedUsersContent;
