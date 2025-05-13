import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { debounce } from 'lodash-es';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface UserTableProps {
  users: User[];
  onDelete: (userId: string) => void;
  loading: boolean;
}

interface UserCardProps {
  user: User;
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

// Constants
const USERS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 300;

// Helper functions
const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
};

const formatPhoneNumber = (phone: string): string => {
  // Simple formatting - can be enhanced with libphonenumber-js for better formatting
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

// Components
const LoadingSkeleton: React.FC<{ count?: number }> = ({ count = USERS_PER_PAGE }) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="animate-pulse flex items-center p-4 bg-white rounded-lg shadow">
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

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, onClear }) => (
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    {value && (
      <button
        onClick={onClear}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
        aria-label="Clear search"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
);

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
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
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          aria-current={currentPage === page ? 'page' : undefined}
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

const UserAvatar: React.FC<{ user: User; size?: 'sm' | 'md' | 'lg' }> = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  return user.avatar ? (
    <img
      src={user.avatar}
      alt={`${user.firstName} ${user.lastName}'s avatar`}
      className={`rounded-full object-cover border ${sizeClasses[size]}`}
    />
  ) : (
    <div className={`rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border ${sizeClasses[size]}`}>
      {getInitials(user.firstName, user.lastName)}
    </div>
  );
};

const DeleteButton: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
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

const UserCard: React.FC<UserCardProps> = ({ user, onDelete }) => (
  <div className="bg-white rounded-lg shadow p-4 flex items-start gap-4">
    <UserAvatar user={user} size="lg" />
    <div className="flex-1">
      <h3 className="font-medium text-gray-900">
        {user.firstName} {user.lastName}
        {user.role && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{user.role}</span>}
      </h3>
      <p className="text-sm text-gray-600">
        <span className="font-medium">Email:</span> {user.email}
      </p>
      <p className="text-sm text-gray-600">
        <span className="font-medium">Phone:</span> {formatPhoneNumber(user.phone)}
      </p>
      <p className="text-sm text-gray-600">
        <span className="font-medium">Title:</span> {user.title}
      </p>
      <p className="text-sm text-gray-500 mt-1">
        <span className="font-medium">Joined:</span> {formatDate(user.createdAt)}
      </p>
    </div>
    <DeleteButton 
      onClick={() => onDelete(user._id)} 
      label={`Delete ${user.firstName} ${user.lastName}`}
    />
  </div>
);

const UserTableRow: React.FC<{ user: User; onDelete: (userId: string) => void }> = ({ user, onDelete }) => (
  <tr className="hover:bg-gray-50 transition-colors border-b last:border-b-0">
    <td className="px-6 py-3">
      <UserAvatar user={user} />
    </td>
    <td className="px-6 py-3 font-medium">
      {user.firstName} {user.lastName}
      {user.role && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{user.role}</span>}
    </td>
    <td className="px-6 py-3">{user.email}</td>
    <td className="px-6 py-3">{formatPhoneNumber(user.phone)}</td>
    <td className="px-6 py-3">{user.title}</td>
    <td className="px-6 py-3">{formatDate(user.createdAt)}</td>
    <td className="px-6 py-3">
      <DeleteButton 
        onClick={() => onDelete(user._id)} 
        label={`Delete ${user.firstName} ${user.lastName}`}
      />
    </td>
  </tr>
);

const UserTable: React.FC<UserTableProps> = ({ users, onDelete, loading }) => {
  if (loading) return <LoadingSkeleton />;
  if (users.length === 0) return <EmptyState />;

  return (
    <table className="min-w-full text-gray-900 p-12">
      <thead className="bg-gray-100 sticky top-0 z-10">
        <tr>
          <th className="px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider text-gray-600">Avatar</th>
          <th className="px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider text-gray-600">Name</th>
          <th className="px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider text-gray-600">Email</th>
          <th className="px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider text-gray-600">Phone</th>
          <th className="px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider text-gray-600">Title</th>
          <th className="px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider text-gray-600">Joined</th>
          <th className="px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider text-gray-600">Action</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <UserTableRow key={user._id} user={user} onDelete={onDelete} />
        ))}
      </tbody>
    </table>
  );
};

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm, userName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Confirm Deletion
        </h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete {userName ? `user ${userName}` : 'this user'}? 
          This action cannot be undone.
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

const UsersContent: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/User-managment');
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        toast.error(error.message, { position: 'top-right' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Handle delete user
  const handleDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const res = await fetch(`/api/User-managment?userId=${userToDelete._id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Failed to delete user');
      
      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      toast.success(`User ${userToDelete.firstName} ${userToDelete.lastName} deleted successfully`, { 
        position: 'top-right' 
      });
    } catch (err) {
      const error = err as Error;
      toast.error(error.message, { position: 'top-right' });
    } finally {
      setShowModal(false);
      setUserToDelete(null);
    }
  };

  // Debounced search
  const debouncedSearchHandler = useMemo(
    () => debounce((value: string) => {
      setSearch(value);
      setPage(1); // Reset to first page on search
    }, DEBOUNCE_DELAY),
    []
  );

  const handleSearchChange = useCallback((value: string) => {
    debouncedSearchHandler(value);
  }, [debouncedSearchHandler]);

  const clearSearch = useCallback(() => {
    setSearch('');
    setPage(1);
    debouncedSearchHandler.cancel();
  }, [debouncedSearchHandler]);

  // Filter and paginate users
  const filteredUsers = useMemo(() => {
    const searchTerm = search.toLowerCase();
    return users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(searchTerm) ||
        user.lastName.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.title.toLowerCase().includes(searchTerm) ||
        (user.role && user.role.toLowerCase().includes(searchTerm))
    );
  }, [users, search]);

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE) || 1;
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(
      (page - 1) * USERS_PER_PAGE,
      page * USERS_PER_PAGE
    );
  }, [filteredUsers, page]);

  // Reset page if it's out of bounds after filtering
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearchHandler.cancel();
    };
  }, [debouncedSearchHandler]);

  const handleDeleteClick = useCallback((userId: string) => {
    const user = users.find(u => u._id === userId);
    if (user) {
      setUserToDelete(user);
      setShowModal(true);
    }
  }, [users]);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen mt-7">
      <ToastContainer />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#026aa1]">User Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
          </p>
        </div>
        <SearchInput 
          value={search} 
          onChange={handleSearchChange} 
          onClear={clearSearch} 
        />
      </div>

      {/* Content */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        {/* Desktop: Table */}
        <div className="hidden md:block overflow-x-auto">
          {error ? (
            <ErrorMessage message={error} />
          ) : (
            <UserTable 
              users={paginatedUsers} 
              onDelete={handleDeleteClick} 
              loading={loading} 
            />
          )}
        </div>

        {/* Mobile: Cards */}
        <div className="md:hidden space-y-4 p-4">
          {loading ? (
            <LoadingSkeleton count={5} />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : paginatedUsers.length === 0 ? (
            <EmptyState />
          ) : (
            paginatedUsers.map((user) => (
              <UserCard 
                key={user._id} 
                user={user} 
                onDelete={handleDeleteClick} 
              />
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {filteredUsers.length > USERS_PER_PAGE && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Pagination 
            currentPage={page} 
            totalPages={totalPages} 
            onPageChange={setPage} 
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        userName={userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}` : undefined}
      />
    </div>
  );
};

export default UsersContent;