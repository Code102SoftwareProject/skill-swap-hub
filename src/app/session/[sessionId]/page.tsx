"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, User, BookOpen, FileText, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Session {
  _id: string;
  user1Id: any;
  user2Id: any;
  skill1Id: any;
  skill2Id: any;
  descriptionOfService1: string;
  descriptionOfService2: string;
  startDate: string;
  isAccepted: boolean;
  status: string;
  progress1?: any;
  progress2?: any;
}

interface Work {
  _id: string;
  session: string;
  provideUser: any;
  receiveUser: any;
  workURL: string;
  workDescription: string;
  provideDate: string;
  acceptanceStatus: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  rating?: number;
  remark?: string;
}

interface SessionProgress {
  _id: string;
  userId: string;
  sessionId: string;
  startDate: string;
  dueDate: string;
  completionPercentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  notes: string;
}

export default function SessionWorkspace() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [session, setSession] = useState<Session | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [myProgress, setMyProgress] = useState<SessionProgress | null>(null);
  const [otherProgress, setOtherProgress] = useState<SessionProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'submit-work' | 'view-works' | 'progress'>('overview');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [otherUserDetails, setOtherUserDetails] = useState<any>(null);

  // Submit work form state
  const [workDescription, setWorkDescription] = useState('');
  const [workFile, setWorkFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Work review state
  const [reviewingWork, setReviewingWork] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<'accept' | 'reject' | null>(null);
  const [reviewMessage, setReviewMessage] = useState('');

  // Progress update state
  const [editingProgress, setEditingProgress] = useState(false);
  const [newProgress, setNewProgress] = useState(0);
  const [progressNotes, setProgressNotes] = useState('');
  const [progressStatus, setProgressStatus] = useState<'not_started' | 'in_progress' | 'completed' | 'abandoned'>('not_started');
  const [updatingProgress, setUpdatingProgress] = useState(false);

  useEffect(() => {
    // Get current user ID - this should be from auth context in real app
    // For now, we'll try to get it from the session data
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  useEffect(() => {
    if (currentUserId && sessionId) {
      fetchWorks();
      fetchProgress();
    }
  }, [currentUserId, sessionId]);

  useEffect(() => {
    if (session && currentUserId) {
      fetchOtherUserDetails();
    }
  }, [session, currentUserId]);

  const fetchOtherUserDetails = async () => {
    if (!session) return;
    
    try {
      const otherUserId = session.user1Id._id === currentUserId ? session.user2Id._id : session.user1Id._id;
      const response = await fetch(`/api/users/profile?id=${otherUserId}`);
      const data = await response.json();
      
      if (data.success) {
        setOtherUserDetails(data.user);
      }
    } catch (error) {
      console.error('Error fetching other user details:', error);
    }
  };

  const fetchSessionData = async () => {
    try {
      const response = await fetch(`/api/session/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        setSession(data.session);
        
        // Get current user ID from the URL or determine from session
        // This is a simplified approach - in a real app, you'd get this from auth
        const urlParams = new URLSearchParams(window.location.search);
        const userIdFromUrl = urlParams.get('userId');
        
        if (userIdFromUrl) {
          setCurrentUserId(userIdFromUrl);
        } else {
          // For demo purposes, you could also check localStorage or use auth context
          const storedUserId = localStorage.getItem('userId');
          if (storedUserId) {
            setCurrentUserId(storedUserId);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  const fetchWorks = async () => {
    try {
      const response = await fetch(`/api/work/session/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        setWorks(data.works);
      }
    } catch (error) {
      console.error('Error fetching works:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/session-progress/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        // Find my progress and other user's progress
        const myProg = data.progress.find((p: SessionProgress) => p.userId === currentUserId);
        const otherProg = data.progress.find((p: SessionProgress) => p.userId !== currentUserId);
        
        setMyProgress(myProg || null);
        setOtherProgress(otherProg || null);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', `sessions/${sessionId}/works`);

    try {
      const response = await fetch('/api/file/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        return data.url;
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      return null;
    }
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workDescription.trim()) {
      alert('Please provide a work description');
      return;
    }

    setUploading(true);
    
    try {
      let workURL = '';
      
      if (workFile) {
        const uploadedUrl = await handleFileUpload(workFile);
        if (!uploadedUrl) {
          alert('Failed to upload file');
          setUploading(false);
          return;
        }
        workURL = uploadedUrl;
      }

      const otherUserId = session?.user1Id._id === currentUserId ? session.user2Id._id : session?.user1Id._id;

      const response = await fetch('/api/work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: sessionId,
          provideUser: currentUserId,
          receiveUser: otherUserId,
          workURL: workURL || 'text-only',
          workDescription,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Work submitted successfully!');
        setWorkDescription('');
        setWorkFile(null);
        fetchWorks(); // Refresh works list
        setActiveTab('view-works');
      } else {
        alert(data.message || 'Failed to submit work');
      }
    } catch (error) {
      console.error('Error submitting work:', error);
      alert('Failed to submit work');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDownloadFile = async (fileURL: string, fileName?: string) => {
    try {
      const response = await fetch(`/api/file/retrieve?fileUrl=${encodeURIComponent(fileURL)}`);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Try to get filename from content-disposition header or use provided name
      const contentDisposition = response.headers.get('content-disposition');
      let downloadFileName = fileName || 'attachment';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          downloadFileName = decodeURIComponent(filenameMatch[1]);
        }
      }
      
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  const handleWorkReview = async (workId: string, action: 'accept' | 'reject', message: string) => {
    try {
      const response = await fetch(`/api/work/${workId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          userId: currentUserId,
          rejectionReason: action === 'reject' ? message : undefined,
          remark: action === 'accept' ? message : undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Work ${action}ed successfully!`);
        setReviewingWork(null);
        setReviewAction(null);
        setReviewMessage('');
        fetchWorks(); // Refresh works list
      } else {
        alert(data.message || `Failed to ${action} work`);
      }
    } catch (error) {
      console.error(`Error ${action}ing work:`, error);
      alert(`Failed to ${action} work`);
    }
  };

  const handleProgressUpdate = async () => {
    if (newProgress < 0 || newProgress > 100) {
      alert('Progress must be between 0 and 100');
      return;
    }

    setUpdatingProgress(true);
    
    try {
      const response = await fetch(`/api/session-progress/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          completionPercentage: newProgress,
          status: progressStatus,
          notes: progressNotes,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Progress updated successfully!');
        setEditingProgress(false);
        setProgressNotes('');
        fetchProgress(); // Refresh progress data
      } else {
        alert(data.message || 'Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Failed to update progress');
    } finally {
      setUpdatingProgress(false);
    }
  };

  const openProgressEditor = () => {
    setNewProgress(myProgress?.completionPercentage || 0);
    setProgressStatus(myProgress?.status || 'not_started');
    setProgressNotes(myProgress?.notes || '');
    setEditingProgress(true);
  };

  // Auto-update status based on progress percentage
  const updateStatusBasedOnProgress = (progress: number) => {
    if (progress === 0) {
      setProgressStatus('not_started');
    } else if (progress === 100) {
      setProgressStatus('completed');
    } else if (progress > 0) {
      setProgressStatus('in_progress');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Not Found</h2>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const otherUser = session.user1Id._id === currentUserId ? session.user2Id : session.user1Id;
  const mySkill = session.user1Id._id === currentUserId ? session.skill1Id : session.skill2Id;
  const otherSkill = session.user1Id._id === currentUserId ? session.skill2Id : session.skill1Id;
  const myDescription = session.user1Id._id === currentUserId ? session.descriptionOfService1 : session.descriptionOfService2;
  const otherDescription = session.user1Id._id === currentUserId ? session.descriptionOfService2 : session.descriptionOfService1;

  // Get proper display name for other user
  const getOtherUserName = () => {
    if (otherUserDetails) {
      const fullName = `${otherUserDetails.firstName || ''} ${otherUserDetails.lastName || ''}`.trim();
      return fullName || otherUserDetails.name || 'Other User';
    }
    return otherUser?.name || `${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`.trim() || 'Other User';
  };

  // Get proper display name for any user
  const getUserName = (user: any) => {
    if (user._id === currentUserId) {
      return 'You';
    }
    if (otherUserDetails && user._id === otherUserDetails._id) {
      const fullName = `${otherUserDetails.firstName || ''} ${otherUserDetails.lastName || ''}`.trim();
      return fullName || otherUserDetails.name || 'Unknown User';
    }
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.name || 'Unknown User';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Session with {getOtherUserName()}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Started:</span>
              <span className="text-sm font-medium">{formatDate(session.startDate)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'submit-work', label: 'Submit Work', icon: Upload },
              { id: 'view-works', label: 'View Works', icon: CheckCircle },
              { id: 'progress', label: 'Progress', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Session Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* What you're offering */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium text-gray-900">You're offering:</h3>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900">{mySkill?.skillTitle}</h4>
                    <p className="text-sm text-blue-700 mt-1">{myDescription}</p>
                    {mySkill?.proficiencyLevel && (
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                        {mySkill.proficiencyLevel}
                      </span>
                    )}
                  </div>
                </div>

                {/* What you're receiving */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium text-gray-900">You're receiving:</h3>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900">{otherSkill?.skillTitle}</h4>
                    <p className="text-sm text-green-700 mt-1">{otherDescription}</p>
                    {otherSkill?.proficiencyLevel && (
                      <span className="inline-block mt-2 px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">
                        {otherSkill.proficiencyLevel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Summary */}
            {(myProgress || otherProgress) && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Progress Summary</h2>
                  <button
                    onClick={() => setActiveTab('progress')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View Details →
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myProgress && (
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-900">Your Progress</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Completion</span>
                          <span className="text-sm font-semibold">{myProgress.completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${myProgress.completionPercentage}%` }}
                          ></div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            myProgress.status === 'completed' ? 'bg-green-100 text-green-800' :
                            myProgress.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            myProgress.status === 'abandoned' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {myProgress.status.replace('_', ' ')}
                          </span>
                          {myProgress.notes && (
                            <span className="text-xs text-gray-500">Has notes</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {otherProgress && (
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-900">{getOtherUserName()}'s Progress</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Completion</span>
                          <span className="text-sm font-semibold">{otherProgress.completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${otherProgress.completionPercentage}%` }}
                          ></div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            otherProgress.status === 'completed' ? 'bg-green-100 text-green-800' :
                            otherProgress.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            otherProgress.status === 'abandoned' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {otherProgress.status.replace('_', ' ')}
                          </span>
                          {otherProgress.notes && (
                            <span className="text-xs text-gray-500">Has notes</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {myProgress && otherProgress ? Math.round((myProgress.completionPercentage + otherProgress.completionPercentage) / 2) : (myProgress?.completionPercentage || otherProgress?.completionPercentage || 0)}%
                      </div>
                      <div className="text-xs text-gray-500">Overall Progress</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{works.filter(w => w.acceptanceStatus === 'accepted').length}</div>
                      <div className="text-xs text-gray-500">Accepted Works</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{works.filter(w => w.acceptanceStatus === 'pending').length}</div>
                      <div className="text-xs text-gray-500">Pending Reviews</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-600">{works.length}</div>
                      <div className="text-xs text-gray-500">Total Submissions</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'submit-work' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit Your Work</h2>
            
            <form onSubmit={handleSubmitWork} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Description *
                </label>
                <textarea
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="Describe the work you've completed, what you've learned, or what you've taught..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attach File (Optional)
                </label>
                <input
                  type="file"
                  onChange={(e) => setWorkFile(e.target.files?.[0] || null)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, ZIP
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setWorkDescription('');
                    setWorkFile(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? 'Submitting...' : 'Submit Work'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'view-works' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Submitted Works ({works.length})
              </h2>
              
              {works.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Works Yet</h3>
                  <p className="text-gray-600">No work has been submitted for this session yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {works.map((work) => (
                    <div key={work._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="font-medium text-gray-900">
                            {getUserName(work.provideUser)}
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            work.acceptanceStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                            work.acceptanceStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {work.acceptanceStatus}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(work.provideDate)}
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{work.workDescription}</p>
                      
                      {work.workURL && work.workURL !== 'text-only' && (
                        <div className="mb-3">
                          <button
                            onClick={() => handleDownloadFile(work.workURL)}
                            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Download Attachment</span>
                          </button>
                        </div>
                      )}
                      
                      {/* Action buttons for receiving user */}
                      {work.receiveUser._id === currentUserId && work.acceptanceStatus === 'pending' && (
                        <div className="mt-3 flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setReviewingWork(work._id);
                              setReviewAction('accept');
                              setReviewMessage('');
                            }}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => {
                              setReviewingWork(work._id);
                              setReviewAction('reject');
                              setReviewMessage('');
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            Request Improvement
                          </button>
                        </div>
                      )}
                      
                      {work.remark && work.acceptanceStatus === 'accepted' && (
                        <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                          <div className="text-sm font-medium text-green-800 mb-1">Acceptance Message:</div>
                          <div className="text-sm text-green-700">{work.remark}</div>
                        </div>
                      )}
                      
                      {work.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <div className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</div>
                          <div className="text-sm text-red-700">{work.rejectionReason}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* Current Progress Display */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Progress Tracking</h2>
                <button
                  onClick={openProgressEditor}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update My Progress
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* My Progress */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Your Progress</h3>
                  {myProgress ? (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-blue-900">Completion</span>
                        <span className="text-lg font-bold text-blue-900">{myProgress.completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-3 mb-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${myProgress.completionPercentage}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-700">Status:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          myProgress.status === 'completed' ? 'bg-green-100 text-green-800' :
                          myProgress.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          myProgress.status === 'abandoned' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {myProgress.status.replace('_', ' ')}
                        </span>
                      </div>
                      {myProgress.notes && (
                        <div className="mt-3">
                          <span className="text-sm font-medium text-blue-900">Notes:</span>
                          <p className="text-sm text-blue-700 mt-1">{myProgress.notes}</p>
                        </div>
                      )}
                      {myProgress.dueDate && (
                        <div className="mt-2">
                          <span className="text-sm text-blue-700">Due: {formatDate(myProgress.dueDate)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-600 text-center">No progress data available</p>
                      <p className="text-sm text-gray-500 text-center mt-1">Click "Update My Progress" to get started</p>
                    </div>
                  )}
                </div>

                {/* Other User's Progress */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">{getOtherUserName()}'s Progress</h3>
                  {otherProgress ? (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-green-900">Completion</span>
                        <span className="text-lg font-bold text-green-900">{otherProgress.completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-3 mb-3">
                        <div
                          className="bg-green-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${otherProgress.completionPercentage}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-green-700">Status:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          otherProgress.status === 'completed' ? 'bg-green-100 text-green-800' :
                          otherProgress.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          otherProgress.status === 'abandoned' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {otherProgress.status.replace('_', ' ')}
                        </span>
                      </div>
                      {otherProgress.notes && (
                        <div className="mt-3">
                          <span className="text-sm font-medium text-green-900">Notes:</span>
                          <p className="text-sm text-green-700 mt-1">{otherProgress.notes}</p>
                        </div>
                      )}
                      {otherProgress.dueDate && (
                        <div className="mt-2">
                          <span className="text-sm text-green-700">Due: {formatDate(otherProgress.dueDate)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-600 text-center">{getOtherUserName()} hasn't updated their progress yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Progress History */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Timeline</h3>
              <div className="space-y-4">
                {/* Combined progress timeline would go here */}
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Progress timeline feature coming soon...</p>
                  <p className="text-sm">Track all progress updates and milestones</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Work Review Modal */}
      {reviewingWork && reviewAction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {reviewAction === 'accept' ? 'Accept Work' : 'Request Improvement'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {reviewAction === 'accept' ? 'Acceptance Message (Optional)' : 'Improvement Request *'}
                </label>
                <textarea
                  value={reviewMessage}
                  onChange={(e) => setReviewMessage(e.target.value)}
                  placeholder={
                    reviewAction === 'accept' 
                      ? 'Add a message to thank or acknowledge the work...' 
                      : 'Please specify what improvements are needed...'
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required={reviewAction === 'reject'}
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setReviewingWork(null);
                    setReviewAction(null);
                    setReviewMessage('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (reviewAction === 'reject' && !reviewMessage.trim()) {
                      alert('Please provide improvement request details');
                      return;
                    }
                    handleWorkReview(reviewingWork, reviewAction, reviewMessage);
                  }}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    reviewAction === 'accept' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {reviewAction === 'accept' ? 'Accept Work' : 'Send Improvement Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Update Modal */}
      {editingProgress && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Your Progress</h3>
              
              {/* Progress Percentage */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Percentage *
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newProgress}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setNewProgress(value);
                      updateStatusBasedOnProgress(value);
                    }}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="w-16">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newProgress}
                      onChange={(e) => {
                        const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                        setNewProgress(value);
                        updateStatusBasedOnProgress(value);
                      }}
                      className="w-full p-2 border border-gray-300 rounded text-center"
                    />
                  </div>
                  <span className="text-sm text-gray-500">%</span>
                </div>
                {/* Progress Bar Preview */}
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${newProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={progressStatus}
                  onChange={(e) => setProgressStatus(e.target.value as any)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="abandoned">Abandoned</option>
                </select>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress Notes (Optional)
                </label>
                <textarea
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  placeholder="Share what you've accomplished, challenges faced, or next steps..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setEditingProgress(false);
                    setProgressNotes('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProgressUpdate}
                  disabled={updatingProgress}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updatingProgress ? 'Updating...' : 'Update Progress'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
