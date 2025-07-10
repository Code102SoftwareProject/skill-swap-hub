"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Video,
  Plus,
  ArrowRight,
  Users,
  User,
  ExternalLink
} from 'lucide-react';
import Meeting from '@/types/meeting';

interface MeetingWithUser extends Meeting {
  otherUser?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

export default function MeetingContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingWithUser[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<MeetingWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (user?._id) {
      fetchMeetings();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortMeetings();
  }, [meetings, searchTerm, statusFilter, sortBy]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      // Get all meetings for the user
      const response = await fetch(`/api/meeting/user?userId=${user?._id}`);
      const data = await response.json();
      
      if (response.ok && data) {
        // Fetch user details for each meeting
        const meetingsWithUsers = await Promise.all(
          data.map(async (meeting: Meeting) => {
            const otherUserId = meeting.senderId === user?._id ? meeting.receiverId : meeting.senderId;
            
            try {
              const userResponse = await fetch(`/api/users/profile?id=${otherUserId}`);
              const userData = await userResponse.json();
              
              return {
                ...meeting,
                otherUser: userData.success ? userData.user : {
                  _id: otherUserId,
                  firstName: 'Unknown',
                  lastName: 'User',
                  email: ''
                }
              };
            } catch (error) {
              console.error('Error fetching user data:', error);
              return {
                ...meeting,
                otherUser: {
                  _id: otherUserId,
                  firstName: 'Unknown',
                  lastName: 'User',
                  email: ''
                }
              };
            }
          })
        );
        
        setMeetings(meetingsWithUsers);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortMeetings = () => {
    let filtered = [...meetings];

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending_received') {
        filtered = filtered.filter(meeting => 
          meeting.state === 'pending' && meeting.receiverId === user?._id
        );
      } else if (statusFilter === 'pending_sent') {
        filtered = filtered.filter(meeting => 
          meeting.state === 'pending' && meeting.senderId === user?._id
        );
      } else {
        filtered = filtered.filter(meeting => meeting.state === statusFilter);
      }
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(meeting => {
        const otherUserName = `${meeting.otherUser?.firstName || ''} ${meeting.otherUser?.lastName || ''}`.toLowerCase();
        const description = meeting.description.toLowerCase();
        
        return otherUserName.includes(searchLower) || description.includes(searchLower);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
        case 'oldest':
          return new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
        case 'meeting_time':
          return new Date(a.meetingTime).getTime() - new Date(b.meetingTime).getTime();
        case 'participant':
          const aName = `${a.otherUser?.firstName || ''} ${a.otherUser?.lastName || ''}`;
          const bName = `${b.otherUser?.firstName || ''} ${b.otherUser?.lastName || ''}`;
          return aName.localeCompare(bName);
        default:
          return 0;
      }
    });

    setFilteredMeetings(filtered);
  };

  const getStatusColor = (meeting: Meeting) => {
    switch (meeting.state) {
      case 'pending':
        return meeting.receiverId === user?._id 
          ? 'bg-blue-100 text-blue-800' 
          : 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': 
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (meeting: Meeting) => {
    switch (meeting.state) {
      case 'pending':
        return meeting.receiverId === user?._id ? <Clock className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (meeting: Meeting) => {
    if (meeting.state === 'pending') {
      return meeting.receiverId === user?._id ? 'Received' : 'Sent';
    }
    return meeting.state.charAt(0).toUpperCase() + meeting.state.slice(1);
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string | Date) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleMeetingClick = (meetingId: string) => {
    router.push(`/user/meeting/${meetingId}`);
  };

  const getMeetingCounts = () => {
    return {
      all: meetings.length,
      pending_received: meetings.filter(m => m.state === 'pending' && m.receiverId === user?._id).length,
      pending_sent: meetings.filter(m => m.state === 'pending' && m.senderId === user?._id).length,
      accepted: meetings.filter(m => m.state === 'accepted').length,
      completed: meetings.filter(m => m.state === 'completed').length,
      cancelled: meetings.filter(m => m.state === 'cancelled' || m.state === 'rejected').length,
    };
  };

  const counts = getMeetingCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Meetings</h1>
          <p className="text-gray-600">Manage and track your video meetings</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Video className="h-4 w-4" />
            <span>{meetings.length} total meetings</span>
          </div>
          <button 
            onClick={() => router.push('/user/chat')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{counts.all}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{counts.pending_received}</div>
          <div className="text-sm text-gray-500">Received</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{counts.pending_sent}</div>
          <div className="text-sm text-gray-500">Sent</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{counts.accepted}</div>
          <div className="text-sm text-gray-500">Accepted</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">{counts.completed}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{counts.cancelled}</div>
          <div className="text-sm text-gray-500">Cancelled</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by participant name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending_received">Pending (Received)</option>
              <option value="pending_sent">Pending (Sent)</option>
              <option value="accepted">Accepted</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled/Rejected</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="meeting_time">Meeting Time</option>
              <option value="participant">Participant Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {filteredMeetings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No meetings found' : 'No meetings yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Start by scheduling your first meeting'}
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <button 
                onClick={() => router.push('/user/chat')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Schedule Meeting</span>
              </button>
            )}
          </div>
        ) : (
          filteredMeetings.map((meeting) => (
            <div
              key={meeting._id}
              onClick={() => handleMeetingClick(meeting._id)}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {`${meeting.otherUser?.firstName || ''} ${meeting.otherUser?.lastName || ''}`.trim() || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {meeting.senderId === user?._id ? 'Meeting requested' : 'Meeting received'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(meeting)}`}>
                    {getStatusIcon(meeting)}
                    <span>{getStatusText(meeting)}</span>
                  </span>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Meeting Details */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Meeting Details
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Description:</div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{meeting.description}</div>
                    </div>
                    <div className="flex space-x-4">
                      <div>
                        <div className="text-sm font-medium text-gray-700">Date:</div>
                        <div className="text-sm text-gray-600">{formatDate(meeting.meetingTime)}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700">Time:</div>
                        <div className="text-sm text-gray-600">{formatTime(meeting.meetingTime)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meeting Actions */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Video className="h-4 w-4 mr-2" />
                    Meeting Actions
                  </h4>
                  <div className="space-y-2">
                    {meeting.state === 'accepted' && meeting.meetingLink && (
                      <a
                        href={meeting.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                      >
                        <Video className="h-4 w-4" />
                        <span>Join Meeting</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    
                    <div className="text-sm text-gray-500">
                      {meeting.state === 'pending' && meeting.receiverId === user?._id && 'Waiting for your response'}
                      {meeting.state === 'pending' && meeting.senderId === user?._id && 'Waiting for acceptance'}
                      {meeting.state === 'accepted' && 'Meeting scheduled'}
                      {meeting.state === 'completed' && 'Meeting completed'}
                      {(meeting.state === 'cancelled' || meeting.state === 'rejected') && 'Meeting cancelled'}
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      Requested on {formatDate(meeting.sentAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
  