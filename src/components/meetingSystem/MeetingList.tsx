import React from 'react';
import { AlertCircle, Calendar, CheckCircle, ChevronDown, ChevronRight, Clock, Plus, XCircle, Radio } from 'lucide-react';
import Meeting from '@/types/meeting';
import MeetingItem from './MeetingItem';

interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface MeetingListProps {
  pendingRequests: Meeting[];
  upcomingMeetings: Meeting[];
  pastMeetings: Meeting[];
  cancelledMeetings: Meeting[];
  currentlyHappeningMeetings: Meeting[];
  hasActiveMeetingsOrRequests: boolean;
  showPastMeetings: boolean;
  showCancelledMeetings: boolean;
  userId: string;
  userProfiles: { [userId: string]: UserProfile };
  meetingNotesStatus: { [meetingId: string]: boolean };
  checkingNotes: { [meetingId: string]: boolean };
  actionLoadingStates: { [meetingId: string]: string };
  token?: string;
  onScheduleMeeting: () => void;
  onMeetingAction: (meetingId: string, action: 'accept' | 'reject' | 'cancel') => void;
  onCancelMeeting: (meetingId: string) => void;
  onAlert: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  onTogglePastMeetings: () => void;
  onToggleCancelledMeetings: () => void;
  showCreateMeetingButton?: boolean; // Optional prop to control create meeting button visibility
}

export default function MeetingList({
  pendingRequests,
  upcomingMeetings,
  pastMeetings,
  cancelledMeetings,
  currentlyHappeningMeetings,
  hasActiveMeetingsOrRequests,
  showPastMeetings,
  showCancelledMeetings,
  userId,
  userProfiles,
  meetingNotesStatus,
  checkingNotes,
  actionLoadingStates,
  onScheduleMeeting,
  onMeetingAction,
  onCancelMeeting,
  onAlert,
  onTogglePastMeetings,
  onToggleCancelledMeetings,
  showCreateMeetingButton = true, // Default to true for backward compatibility
  token
}: MeetingListProps) {
  const totalMeetings = pendingRequests.length + upcomingMeetings.length + pastMeetings.length + cancelledMeetings.length + currentlyHappeningMeetings.length;

  if (totalMeetings === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 text-sm mb-4">No meetings scheduled</p>
        {showCreateMeetingButton && (
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto text-sm"
            onClick={onScheduleMeeting}
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Meeting
          </button>
        )}
        {!showCreateMeetingButton && (
          <p className="text-gray-400 text-xs">
            Meetings can be scheduled through skill matches in the chat system
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Pending Meeting Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-yellow-500" />
            Pending Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-3">
            {pendingRequests.map((meeting) => (
              <MeetingItem 
                key={meeting._id} 
                meeting={meeting} 
                type="pending"
                userId={userId}
                userProfiles={userProfiles}
                meetingNotesStatus={meetingNotesStatus}
                checkingNotes={checkingNotes}
                actionLoadingStates={actionLoadingStates}
                token={token}
                onMeetingAction={onMeetingAction}
                onCancelMeeting={onCancelMeeting}
                onAlert={onAlert}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Currently Happening Meetings */}
      {currentlyHappeningMeetings.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Radio className="w-4 h-4 mr-2 text-red-500 animate-pulse" />
            <span className="text-red-600 font-semibold">Currently Happening ({currentlyHappeningMeetings.length})</span>
          </h3>
          <div className="space-y-3">
            {currentlyHappeningMeetings.map((meeting) => (
              <div key={meeting._id} className="relative">
                {/* Animated highlight border */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-500 via-orange-500 to-red-500 p-0.5 animate-pulse">
                  <div className="bg-white rounded-lg h-full w-full"></div>
                </div>
                <div className="relative z-10">
                  <MeetingItem 
                    meeting={meeting} 
                    type="happening"
                    userId={userId}
                    userProfiles={userProfiles}
                    meetingNotesStatus={meetingNotesStatus}
                    checkingNotes={checkingNotes}
                    actionLoadingStates={actionLoadingStates}
                    token={token}
                    onMeetingAction={onMeetingAction}
                    onCancelMeeting={onCancelMeeting}
                    onAlert={onAlert}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-blue-500" />
            Upcoming Meetings ({upcomingMeetings.length})
          </h3>
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <MeetingItem 
                key={meeting._id} 
                meeting={meeting} 
                type="upcoming"
                userId={userId}
                userProfiles={userProfiles}
                meetingNotesStatus={meetingNotesStatus}
                checkingNotes={checkingNotes}
                actionLoadingStates={actionLoadingStates}
                token={token}
                onMeetingAction={onMeetingAction}
                onCancelMeeting={onCancelMeeting}
                onAlert={onAlert}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Active Meetings Message */}
      {!hasActiveMeetingsOrRequests && (
        <div className="text-center py-6">
          <CheckCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">
            No active meetings or pending requests
          </p>
        </div>
      )}

      {/* Past Meetings - Collapsible */}
      {pastMeetings.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
          <button
            onClick={onTogglePastMeetings}
            className="w-full bg-gray-50 hover:bg-gray-100 px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 transition-colors"
          >
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              <span>Past Meetings ({pastMeetings.length})</span>
            </div>
            {showPastMeetings ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {showPastMeetings && (
            <div className="p-4 bg-white space-y-3">
              {pastMeetings.slice().reverse().map((meeting) => (
                <MeetingItem 
                  key={meeting._id} 
                  meeting={meeting} 
                  type="past"
                  userId={userId}
                  userProfiles={userProfiles}
                  meetingNotesStatus={meetingNotesStatus}
                  checkingNotes={checkingNotes}
                  actionLoadingStates={actionLoadingStates}
                  token={token}
                  onMeetingAction={onMeetingAction}
                  onCancelMeeting={onCancelMeeting}
                  onAlert={onAlert}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cancelled Meetings - Collapsible */}
      {cancelledMeetings.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={onToggleCancelledMeetings}
            className="w-full bg-gray-50 hover:bg-gray-100 px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 transition-colors"
          >
            <div className="flex items-center">
              <XCircle className="w-4 h-4 mr-2 text-red-500" />
              <span>Cancelled Meetings ({cancelledMeetings.length})</span>
            </div>
            {showCancelledMeetings ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {showCancelledMeetings && (
            <div className="p-4 bg-white space-y-3">
              {cancelledMeetings.slice().reverse().map((meeting) => (
                <MeetingItem 
                  key={meeting._id} 
                  meeting={meeting} 
                  type="cancelled"
                  userId={userId}
                  userProfiles={userProfiles}
                  meetingNotesStatus={meetingNotesStatus}
                  checkingNotes={checkingNotes}
                  actionLoadingStates={actionLoadingStates}
                  token={token}
                  onMeetingAction={onMeetingAction}
                  onCancelMeeting={onCancelMeeting}
                  onAlert={onAlert}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
