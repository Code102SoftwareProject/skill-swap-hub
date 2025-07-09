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
  Users, 
  BookOpen, 
  Calendar,
  ArrowRight,
  Activity,
  User
} from 'lucide-react';

interface Session {
  _id: string;
  user1Id: any;
  user2Id: any;
  skill1Id: any;
  skill2Id: any;
  descriptionOfService1: string;
  descriptionOfService2: string;
  startDate: string;
  isAccepted: boolean | null;
  status: 'pending' | 'active' | 'completed' | 'canceled';
  progress1?: any;
  progress2?: any;
  createdAt: string;
}

export default function SessionsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (user?._id) {
      fetchSessions();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortSessions();
  }, [sessions, searchTerm, statusFilter, sortBy]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/session?userId=${user?._id}`);
      const data = await response.json();
      
      if (data.success) {
        let sessions = data.sessions;
        
        // Check if sessions are populated
        const isPopulated = sessions.length > 0 && sessions[0].user1Id?.firstName;
        
        if (!isPopulated && sessions.length > 0) {
          // Manually populate if needed
          const userIds = new Set();
          const skillIds = new Set();
          
          sessions.forEach((session: any) => {
            if (typeof session.user1Id === 'string') userIds.add(session.user1Id);
            if (typeof session.user2Id === 'string') userIds.add(session.user2Id);
            if (typeof session.skill1Id === 'string') skillIds.add(session.skill1Id);
            if (typeof session.skill2Id === 'string') skillIds.add(session.skill2Id);
          });
          
          if (userIds.size > 0 || skillIds.size > 0) {
            const populateResponse = await fetch(
              `/api/session/populate?userIds=${Array.from(userIds).join(',')}&skillIds=${Array.from(skillIds).join(',')}`
            );
            const populateData = await populateResponse.json();
            
            if (populateData.success) {
              // Create lookup maps
              const userMap = new Map();
              const skillMap = new Map();
              
              populateData.users.forEach((user: any) => userMap.set(user._id, user));
              populateData.skills.forEach((skill: any) => skillMap.set(skill._id, skill));
              
              // Populate sessions manually
              sessions = sessions.map((session: any) => ({
                ...session,
                user1Id: userMap.get(session.user1Id) || { _id: session.user1Id, firstName: 'Unknown', lastName: 'User' },
                user2Id: userMap.get(session.user2Id) || { _id: session.user2Id, firstName: 'Unknown', lastName: 'User' },
                skill1Id: skillMap.get(session.skill1Id) || { _id: session.skill1Id, skillTitle: 'Unknown Skill', proficiencyLevel: '' },
                skill2Id: skillMap.get(session.skill2Id) || { _id: session.skill2Id, skillTitle: 'Unknown Skill', proficiencyLevel: '' }
              }));
            }
          }
        }
        
        setSessions(sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSessions = () => {
    let filtered = [...sessions];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(session => {
        const otherUser = getOtherUser(session);
        const otherUserName = `${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`.toLowerCase();
        const mySkill = getMySkill(session);
        const otherSkill = getOtherSkill(session);
        
        return otherUserName.includes(searchLower) ||
               mySkill?.skillTitle?.toLowerCase().includes(searchLower) ||
               otherSkill?.skillTitle?.toLowerCase().includes(searchLower);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'progress':
          const aProgress = getSessionProgress(a);
          const bProgress = getSessionProgress(b);
          return bProgress - aProgress;
        case 'partner':
          const aPartner = getOtherUser(a);
          const bPartner = getOtherUser(b);
          const aName = `${aPartner?.firstName || ''} ${aPartner?.lastName || ''}`;
          const bName = `${bPartner?.firstName || ''} ${bPartner?.lastName || ''}`;
          return aName.localeCompare(bName);
        default:
          return 0;
      }
    });

    setFilteredSessions(filtered);
  };

  const getOtherUser = (session: Session) => {
    const user1 = session.user1Id;
    const user2 = session.user2Id;
    
    // Handle case where user data might not be populated
    if (typeof user1 === 'string' || typeof user2 === 'string') {
      return { _id: 'unknown', firstName: 'Unknown', lastName: 'User' };
    }
    
    // Check if we're user1 or user2
    const currentUserId = user?._id;
    if (user1._id === currentUserId || user1 === currentUserId) {
      return user2;
    } else {
      return user1;
    }
  };

  const getMySkill = (session: Session) => {
    const skill1 = session.skill1Id;
    const skill2 = session.skill2Id;
    const user1 = session.user1Id;
    
    // Handle case where skill data might not be populated
    if (typeof skill1 === 'string' || typeof skill2 === 'string') {
      return { _id: 'unknown', skillTitle: 'Unknown Skill', proficiencyLevel: '' };
    }
    
    // Check if we're user1 or user2 to get the right skill
    const currentUserId = user?._id;
    const isUser1 = (typeof user1 === 'string' ? user1 : user1._id) === currentUserId;
    
    return isUser1 ? skill1 : skill2;
  };

  const getOtherSkill = (session: Session) => {
    const skill1 = session.skill1Id;
    const skill2 = session.skill2Id;
    const user1 = session.user1Id;
    
    // Handle case where skill data might not be populated
    if (typeof skill1 === 'string' || typeof skill2 === 'string') {
      return { _id: 'unknown', skillTitle: 'Unknown Skill', proficiencyLevel: '' };
    }
    
    // Check if we're user1 or user2 to get the other user's skill
    const currentUserId = user?._id;
    const isUser1 = (typeof user1 === 'string' ? user1 : user1._id) === currentUserId;
    
    return isUser1 ? skill2 : skill1;
  };

  const getMyDescription = (session: Session) => {
    const user1 = session.user1Id;
    const currentUserId = user?._id;
    const isUser1 = (typeof user1 === 'string' ? user1 : user1._id) === currentUserId;
    return isUser1 ? session.descriptionOfService1 : session.descriptionOfService2;
  };

  const getOtherDescription = (session: Session) => {
    const user1 = session.user1Id;
    const currentUserId = user?._id;
    const isUser1 = (typeof user1 === 'string' ? user1 : user1._id) === currentUserId;
    return isUser1 ? session.descriptionOfService2 : session.descriptionOfService1;
  };

  const getSessionProgress = (session: Session) => {
    if (!session.progress1 || !session.progress2) return 0;
    
    const user1 = session.user1Id;
    const currentUserId = user?._id;
    const isUser1 = (typeof user1 === 'string' ? user1 : user1._id) === currentUserId;
    const myProgress = isUser1 ? session.progress1 : session.progress2;
    const otherProgress = isUser1 ? session.progress2 : session.progress1;
    
    return Math.round((myProgress.completionPercentage + otherProgress.completionPercentage) / 2);
  };

  const getMyProgress = (session: Session) => {
    if (!session.progress1 || !session.progress2) return null;
    const user1 = session.user1Id;
    const currentUserId = user?._id;
    const isUser1 = (typeof user1 === 'string' ? user1 : user1._id) === currentUserId;
    return isUser1 ? session.progress1 : session.progress2;
  };

  const getOtherProgress = (session: Session) => {
    if (!session.progress1 || !session.progress2) return null;
    const user1 = session.user1Id;
    const currentUserId = user?._id;
    const isUser1 = (typeof user1 === 'string' ? user1 : user1._id) === currentUserId;
    return isUser1 ? session.progress2 : session.progress1;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'active': return <Activity className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'canceled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/session/${sessionId}`);
  };

  const getSessionCounts = () => {
    return {
      all: sessions.length,
      pending: sessions.filter(s => s.status === 'pending').length,
      active: sessions.filter(s => s.status === 'active').length,
      completed: sessions.filter(s => s.status === 'completed').length,
      canceled: sessions.filter(s => s.status === 'canceled').length,
    };
  };

  const counts = getSessionCounts();

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
          <h1 className="text-2xl font-bold text-gray-900">My Sessions</h1>
          <p className="text-gray-600">Manage and track your skill exchange sessions</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          <span>{sessions.length} total sessions</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{counts.all}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{counts.pending}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{counts.active}</div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{counts.completed}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{counts.canceled}</div>
          <div className="text-sm text-gray-500">Canceled</div>
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
              placeholder="Search by partner name or skills..."
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
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
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
              <option value="progress">Progress</option>
              <option value="partner">Partner Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No sessions found' : 'No sessions yet'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Start by creating your first skill exchange session'}
            </p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const otherUser = getOtherUser(session);
            const mySkill = getMySkill(session);
            const otherSkill = getOtherSkill(session);
            const myProgress = getMyProgress(session);
            const otherProgress = getOtherProgress(session);
            const overallProgress = getSessionProgress(session);

            return (
              <div
                key={session._id}
                onClick={() => handleSessionClick(session._id)}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {`${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`.trim() || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Started {formatDate(session.startDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {getStatusIcon(session.status)}
                      <span className="capitalize">{session.status}</span>
                    </span>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Skills Exchange */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Skills Exchange
                    </h4>
                    <div className="space-y-2">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="text-sm font-medium text-blue-900">You're offering:</div>
                        <div className="text-sm text-blue-700">{mySkill?.skillTitle}</div>
                        {mySkill?.proficiencyLevel && (
                          <span className="inline-block mt-1 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                            {mySkill.proficiencyLevel}
                          </span>
                        )}
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="text-sm font-medium text-green-900">You're learning:</div>
                        <div className="text-sm text-green-700">{otherSkill?.skillTitle}</div>
                        {otherSkill?.proficiencyLevel && (
                          <span className="inline-block mt-1 px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">
                            {otherSkill.proficiencyLevel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Activity className="h-4 w-4 mr-2" />
                      Progress Overview
                    </h4>
                    {session.status === 'active' && myProgress && otherProgress ? (
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Overall Progress</span>
                            <span className="font-medium">{overallProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${overallProgress}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-medium">Your Progress</div>
                            <div className="text-blue-600">{myProgress.completionPercentage}%</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">Partner's Progress</div>
                            <div className="text-green-600">{otherProgress.completionPercentage}%</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-4">
                        {session.status === 'pending' ? 'Waiting for acceptance' :
                         session.status === 'completed' ? 'Session completed!' :
                         session.status === 'canceled' ? 'Session was canceled' :
                         'No progress data available'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
  