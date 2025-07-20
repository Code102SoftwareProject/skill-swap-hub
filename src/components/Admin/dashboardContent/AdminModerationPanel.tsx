'use client';

import { useState, useEffect } from 'react';
import { Loader2, X, ShieldAlert, ShieldCheck, Download, EyeOff, Eye, AlertCircle, UserX, UserCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { processAvatarUrl, createFallbackAvatar } from '@/utils/imageUtils';
// Remove import { Tooltip } from 'react-tooltip';

// Custom loader for R2 images
const r2Loader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
  return `/api/file/retrieve?fileUrl=${encodeURIComponent(src)}&width=${width}&quality=${quality || 75}`;
};

interface UserStat {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  totalSuggestions: number;
  maxSuggestionsIn1Day: number;
  status: 'Normal' | 'Suspicious';
  isBlocked?: boolean;
  hasHiddenSuggestions?: boolean;
}

interface Suggestion {
  _id: string;
  title: string;
  category: string;
  status: string;
  date: string;
  isHidden?: boolean;
}

// Helper to get the correct avatar src (prevents double-processing)
function getProcessedAvatarUrl(avatarUrl: string | undefined): string {
  if (!avatarUrl) return '/default-avatar.png';
  if (avatarUrl.startsWith('/api/file/retrieve')) return avatarUrl;
  return processAvatarUrl(avatarUrl) || '/default-avatar.png';
}

// Skeleton loader for table rows
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-6 py-4">
            <div className="h-10 w-10 bg-gray-200 rounded-full" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </td>
          <td className="px-6 py-4 text-center">
            <div className="h-5 w-16 bg-gray-200 rounded mx-auto" />
          </td>
          <td className="px-6 py-4 text-right">
            <div className="h-4 w-20 bg-gray-200 rounded ml-auto" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

// Skeleton loader for modal
function ModalSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-16 w-16 bg-gray-200 rounded-full" />
        <div>
          <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-24 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="h-16 bg-gray-100 rounded" />
        <div className="h-16 bg-gray-100 rounded" />
        <div className="h-16 bg-gray-100 rounded" />
      </div>
      <div className="h-5 w-40 bg-gray-200 rounded mb-3" />
      <div className="h-32 bg-gray-100 rounded" />
      <div className="flex gap-3 mt-6">
        <div className="h-10 w-32 bg-gray-200 rounded" />
        <div className="h-10 w-32 bg-gray-200 rounded" />
        <div className="h-10 w-32 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

// Confirmation dialog component
function ConfirmDialog({ open, onConfirm, onCancel, title, message, confirmText = 'Confirm', cancelText = 'Cancel' }: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 dark:bg-opacity-80">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-100">{title}</h3>
        <p className="mb-4 text-gray-600 dark:text-gray-300">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminModerationPanel() {
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserStat | null>(null);
  const [userSuggestions, setUserSuggestions] = useState<Suggestion[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserModalLoading, setIsUserModalLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'blocked' | 'hidden'>('all');
  const [confirmAction, setConfirmAction] = useState<null | { type: 'block' | 'hide' | 'unhide'; user: UserStat }>(null);
  const [actionLoading, setActionLoading] = useState<'block' | 'hide' | 'unhide' | null>(null);

  // Filter users based on search term and active tab
  const filteredUsers = userStats.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (activeTab) {
      case 'blocked':
        return user.isBlocked === true;
      case 'hidden':
        return user.hasHiddenSuggestions === true;
      default:
        return user.totalSuggestions > 0; // 'all' tab shows only users with suggestions
    }
  });
  const USERS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

  const fetchUserStats = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching user stats...');
      const res = await fetch('/api/suggestions/admin-stats');
      const data = await res.json();
      console.log('User stats received:', data);
      setUserStats(data);
    } catch (error) {
      console.error('Failed to load user stats:', error);
      toast.error('Failed to load user stats');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserBlockStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/User-managment/${userId}`);
      if (!res.ok) {
        console.error('Failed to fetch user block status:', res.status);
        return false;
      }
      const data = await res.json();
      console.log('User block status data:', data);
      return data.isBlocked || false;
    } catch (error) {
      console.error('Error fetching user block status:', error);
      return false;
    }
  };

  const fetchUserSuggestions = async (userId: string) => {
    setIsUserModalLoading(true);
    try {
      const res = await fetch(`/api/suggestions/user/${userId}/admin`);
      const data = await res.json();
      setUserSuggestions(data);
    } catch (error) {
      toast.error('Failed to load user suggestions');
    } finally {
      setIsUserModalLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, []);

  const handleBlockUser = async () => {
    if (!selectedUser) return;
    
    try {
      console.log('Blocking user:', selectedUser.userId, 'Current status:', selectedUser.isBlocked);
      
      const res = await fetch('/api/suggestions/block-user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedUser.userId, 
          isBlocked: !selectedUser.isBlocked 
        }),
      });
      
      console.log('Block response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Block response error:', errorData);
        throw new Error('Failed to update block status');
      }
      
      const responseData = await res.json();
      console.log('Block response data:', responseData);
      
      const newBlockStatus = !selectedUser.isBlocked;
      toast.success(newBlockStatus ? 'User blocked' : 'User unblocked');
      
      // Update the selected user state
      setSelectedUser({ ...selectedUser, isBlocked: newBlockStatus });
      
      // Update the user stats to reflect the change in the main table
      await fetchUserStats();
      
      // Close the modal after successful block/unblock
      setIsUserModalOpen(false);
    } catch (error) {
      console.error('Block user error:', error);
      toast.error('Failed to update block status');
    }
  };

  const handleHideSuggestions = async () => {
    if (!selectedUser) return;
    
    try {
      const res = await fetch('/api/suggestions/hide-user-suggestions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.userId }),
      });
      
      if (!res.ok) throw new Error('Failed to hide suggestions');
      
      const data = await res.json();
      toast.success(data.message || 'All suggestions hidden from user view');
      await fetchUserStats();
      setIsUserModalOpen(false);
    } catch {
      toast.error('Failed to hide suggestions');
    }
  };

  const handleUnhideSuggestions = async () => {
    if (!selectedUser) return;
    
    try {
      const res = await fetch('/api/suggestions/unhide-user-suggestions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.userId }),
      });
      
      if (!res.ok) throw new Error('Failed to unhide suggestions');
      
      const data = await res.json();
      toast.success(data.message || 'All suggestions unhidden and visible to user');
      await fetchUserStats();
      setIsUserModalOpen(false);
    } catch {
      toast.error('Failed to unhide suggestions');
    }
  };



  return (
    <div className="mt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Moderation Panel</h2>
          <p className="text-gray-500 text-sm">Monitor and manage user suggestion activity</p>
        </div>
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users with Suggestions
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                {userStats.filter(u => u.totalSuggestions > 0).length}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab('blocked');
                setCurrentPage(1);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'blocked'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Blocked Users
              <span className="ml-2 bg-red-100 text-red-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                {userStats.filter(u => u.isBlocked && u.totalSuggestions > 0).length}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab('hidden');
                setCurrentPage(1);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'hidden'
                  ? 'border-gray-500 text-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Hidden Suggestions
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                {userStats.filter(u => u.hasHiddenSuggestions && u.totalSuggestions > 0).length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <thead className="bg-indigo-50 dark:bg-indigo-900 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-800">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <ShieldAlert className="h-10 w-10 mb-2" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm">Try adjusting your search query</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => {
                    console.log('Rendering user:', { name: user.name, isBlocked: user.isBlocked, status: user.status, hasHiddenSuggestions: user.hasHiddenSuggestions });
                    return (
                    <tr key={user.userId} className={`${user.status === 'Suspicious' ? 'bg-red-50' : ''} hover:bg-gray-50`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden relative bg-gray-100">
                            {user.avatarUrl ? (
                              <Image
                                src={processAvatarUrl(user.avatarUrl) || '/default-avatar.png'}
                                alt={user.name}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = createFallbackAvatar(user.name.split(' ')[0], user.name.split(' ')[1]);
                                  target.onerror = null;
                                }}
                                unoptimized={!user.avatarUrl.startsWith('/api/file/retrieve')}
                              />
                            ) : (
                              <Image
                                src={createFallbackAvatar(user.name.split(' ')[0], user.name.split(' ')[1])}
                                alt={user.name}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                                unoptimized
                              />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-4">
                          <div>
                            <div className="text-xs text-gray-500">Total</div>
                            <div className="text-sm font-medium text-gray-600">{user.totalSuggestions}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Max/Day</div>
                            <div className={`text-sm font-medium ${user.maxSuggestionsIn1Day > 10 ? 'text-red-600' : 'text-gray-700'}`}>
                              {user.maxSuggestionsIn1Day}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 inline-flex items-center text-xs font-semibold rounded-full ${user.status === 'Suspicious' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'}`}>
                          {user.status === 'Suspicious' ? (
                            <ShieldAlert className="mr-1 h-3 w-3" />
                          ) : (
                            <ShieldCheck className="mr-1 h-3 w-3" />
                          )}
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={async () => {
                            setSelectedUser({ ...user, isBlocked: await fetchUserBlockStatus(user.userId) });
                            await fetchUserSuggestions(user.userId);
                            setIsUserModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </>
          )}
        </table>
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-4">
            <button
              className="px-3 py-1 rounded bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 font-semibold disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="text-indigo-700 dark:text-indigo-200 font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="px-3 py-1 rounded bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 font-semibold disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
        {filteredUsers.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500">
            Showing {filteredUsers.length} of {userStats.filter(u => u.totalSuggestions > 0).length} users with suggestions
            {activeTab === 'blocked' && ` (${userStats.filter(u => u.isBlocked && u.totalSuggestions > 0).length} blocked with suggestions)`}
            {activeTab === 'hidden' && ` (${userStats.filter(u => u.hasHiddenSuggestions && u.totalSuggestions > 0).length} with hidden suggestions)`}
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {isUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fadeIn">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden relative bg-gray-100">
                  {selectedUser.avatarUrl ? (
                    <Image
                      src={processAvatarUrl(selectedUser.avatarUrl) || '/default-avatar.png'}
                      alt={selectedUser.name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = createFallbackAvatar(selectedUser.name.split(' ')[0], selectedUser.name.split(' ')[1]);
                        target.onerror = null;
                      }}
                      unoptimized={!selectedUser.avatarUrl.startsWith('/api/file/retrieve')}
                    />
                  ) : (
                    <Image
                      src={createFallbackAvatar(selectedUser.name.split(' ')[0], selectedUser.name.split(' ')[1])}
                      alt={selectedUser.name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedUser.name}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="text-blue-600 text-sm font-medium">Total Suggestions</div>
                  <div className="text-2xl font-bold text-blue-800">{selectedUser.totalSuggestions}</div>
                </div>
                <div className={`p-4 rounded-lg border ${selectedUser.maxSuggestionsIn1Day > 10 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                  <div className={`text-sm font-medium ${selectedUser.maxSuggestionsIn1Day > 10 ? 'text-red-600' : 'text-green-600'}`}>Max in 1 Day</div>
                  <div className={`text-2xl font-bold ${selectedUser.maxSuggestionsIn1Day > 10 ? 'text-red-800' : 'text-green-800'}`}>{selectedUser.maxSuggestionsIn1Day}</div>
                </div>
                <div className={`p-4 rounded-lg border ${selectedUser.status === 'Suspicious' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                  <div className={`text-sm font-medium ${selectedUser.status === 'Suspicious' ? 'text-red-600' : 'text-green-600'}`}>Status</div>
                  <div className={`text-2xl font-bold ${selectedUser.status === 'Suspicious' ? 'text-red-800' : 'text-green-800'}`}>
                    {selectedUser.status === 'Suspicious' ? (
                      <span className="flex items-center gap-1"><ShieldAlert className="inline" /> Suspicious</span>
                    ) : (
                      <span className="flex items-center gap-1"><ShieldCheck className="inline" /> Normal</span>
                    )}
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${selectedUser.isBlocked ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                  <div className={`text-sm font-medium ${selectedUser.isBlocked ? 'text-red-600' : 'text-green-600'}`}>Block Status</div>
                  <div className={`text-2xl font-bold ${selectedUser.isBlocked ? 'text-red-800' : 'text-green-800'}`}>
                    {selectedUser.isBlocked ? (
                      <span className="flex items-center gap-1"><UserX className="inline" /> Blocked</span>
                    ) : (
                      <span className="flex items-center gap-1"><UserCheck className="inline" /> Active</span>
                    )}
                  </div>
                </div>
              </div>

              <h4 className="text-lg font-semibold mb-3 text-gray-800">Recent Suggestions</h4>
              <div className="border rounded-lg overflow-hidden">
                {isUserModalLoading ? (
                  <ModalSkeleton />
                ) : userSuggestions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                    No suggestions found for this user
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visibility</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userSuggestions.map((suggestion) => (
                          <tr key={suggestion._id} className={suggestion.isHidden ? 'bg-gray-50' : ''}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{suggestion.title}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{suggestion.category}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                suggestion.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                suggestion.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {suggestion.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {suggestion.isHidden ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  <EyeOff className="inline mr-1 h-3 w-3" />
                                  Hidden
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Visible
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {new Date(suggestion.date).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setConfirmAction({ type: 'block', user: selectedUser })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors ${selectedUser.isBlocked ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} disabled:opacity-60`}
                  disabled={actionLoading === 'block'}
                  title={selectedUser.isBlocked ? 'Unblock User' : 'Block User'}
                >
                  {actionLoading === 'block' ? <Loader2 className="animate-spin w-4 h-4" /> : selectedUser.isBlocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  {selectedUser.isBlocked ? 'Unblock' : 'Block'}
                </button>

                {!selectedUser.hasHiddenSuggestions && (
                  <button
                    onClick={() => setConfirmAction({ type: 'hide', user: selectedUser })}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-sm bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
                    title="Hide All Suggestions"
                  >
                    <EyeOff className="w-4 h-4" />
                    Hide All
                  </button>
                )}

                {selectedUser.hasHiddenSuggestions && (
                  <button
                    onClick={() => setConfirmAction({ type: 'unhide', user: selectedUser })}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-sm bg-green-500 hover:bg-green-600 text-white transition-colors"
                    title="Unhide All Suggestions"
                  >
                    <Eye className="w-4 h-4" />
                    Unhide All
                  </button>
                )}

                <a
                  href={`/api/suggestions/user/${selectedUser.userId}/export`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Export as CSV"
                >
                  <Download className="w-4 h-4" />
                  Export
                </a>


              </div>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <ConfirmDialog
          open={!!confirmAction}
          onConfirm={() => {
            if (confirmAction.type === 'block') {
              setActionLoading('block');
              handleBlockUser().then(() => setActionLoading(null));
            } else if (confirmAction.type === 'hide') {
              setActionLoading('hide');
              handleHideSuggestions().then(() => setActionLoading(null));
            } else if (confirmAction.type === 'unhide') {
              setActionLoading('unhide');
              handleUnhideSuggestions().then(() => setActionLoading(null));
            }
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
          title={`${confirmAction.type === 'block' ? 'Block User' : confirmAction.type === 'hide' ? 'Hide All Suggestions' : 'Unhide All Suggestions'}`}
          message={`Are you sure you want to ${confirmAction.type === 'block' ? 'block' : confirmAction.type === 'hide' ? 'hide all suggestions' : 'unhide all suggestions'} this user? This action cannot be undone.`}
          confirmText={actionLoading === confirmAction.type ? 'Processing...' : confirmAction.type === 'block' ? 'Block' : confirmAction.type === 'hide' ? 'Hide' : 'Unhide'}
          cancelText={actionLoading === confirmAction.type ? 'Cancelling...' : 'Cancel'}
        />
      )}
    </div>
  );
}