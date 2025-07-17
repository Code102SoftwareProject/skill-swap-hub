'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

// No need for global Window extension, use ts-ignore for browser SpeechRecognition
import { 
  DailyProvider, 
  useDaily, 
  useParticipantIds, 
  useLocalParticipant, 
  useParticipant,
  useScreenShare,
  useMeetingState,
  DailyVideo,
  DailyAudio
} from '@daily-co/daily-react';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Monitor, 
  MonitorOff, 
  Users,
  Maximize,
  Minimize,
  StickyNote
} from 'lucide-react';
import { MeetingNotesSidebar } from './MeetingNotesSidebar';

interface DailyMeetingProps {
  roomUrl: string;
  onLeave?: () => void;
  meetingId?: string;
  userName?: string;
  userId?: string;
  otherUserName?: string;
  meetingDescription?: string;
}

// Custom styles for video containers
const videoStyles = `
  .daily-video-container video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #000;
  }
  
  .daily-screen-share video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }
  
  .daily-camera-box {
    min-width: 128px;
    min-height: 96px;
  }
`;

// Inject styles once
if (typeof document !== 'undefined' && !document.getElementById('daily-video-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'daily-video-styles';
  styleSheet.type = 'text/css';
  styleSheet.innerText = videoStyles;
  document.head.appendChild(styleSheet);
}

// Limit restarts to avoid browser throttling
const MAX_RESTARTS_PER_MINUTE = 10;
let restartTimestamps: number[] = [];

// Inner component that uses Daily React hooks
function DailyMeetingInner({ 
  onLeave, 
  otherUserName, 
  meetingDescription,
  meetingId,
  userName,
  userId 
}: Omit<DailyMeetingProps, 'roomUrl'>) {
  // Daily React hooks
  const daily = useDaily();
  const participantIds = useParticipantIds();
  const localParticipant = useLocalParticipant();
  const meetingState = useMeetingState();
  const { screens, isSharingScreen, startScreenShare, stopScreenShare } = useScreenShare();

  // UI State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Meeting control functions  
  const toggleAudio = useCallback(async () => {
    if (!daily) return;
    await daily.setLocalAudio(!localParticipant?.audio);
  }, [daily, localParticipant?.audio]);

  const toggleVideo = useCallback(async () => {
    if (!daily) return;
    await daily.setLocalVideo(!localParticipant?.video);
  }, [daily, localParticipant?.video]);

  const toggleScreenShare = useCallback(async () => {
    if (!daily) return;
    try {
      if (isSharingScreen) {
        stopScreenShare();
      } else {
        startScreenShare();
      }
    } catch (error) {
      console.error('Screen share error:', error);
    }
  }, [daily, isSharingScreen, startScreenShare, stopScreenShare]);

  // Enhanced leave meeting function
  const leaveMeeting = useCallback(async () => {
    // Leave the Daily meeting
    if (daily) {
      await daily.leave();
    }

    // Call the onLeave callback
    if (onLeave) {
      onLeave();
    }
  }, [daily, onLeave]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!videoContainerRef.current) return;

    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Render participant video using Daily React components
  const renderParticipant = (participantId: string) => {
    return (
      <ParticipantTile
        key={participantId}
        participantId={participantId}
        isLocal={participantId === localParticipant?.session_id}
        hasScreenShare={screens.length > 0}
      />
    );
  };

  // Render screen share layout
  const renderScreenShare = () => {
    if (screens.length === 0) return null;
    
    const screenShareParticipant = screens[0];
    
    return (
      <div className="flex h-full gap-4">
        {/* Main screen share area */}
        <div className="flex-1 relative bg-gray-900 rounded-lg overflow-hidden">
          <div className="daily-screen-share">
            <DailyVideo 
              sessionId={screenShareParticipant.session_id}
              type="screenVideo"
            />
          </div>
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center">
            <Monitor className="w-3 h-3 mr-1" />
            Screen Share
          </div>
        </div>
        
        {/* Camera videos sidebar */}
        <div className="w-40 flex flex-col gap-2 overflow-y-auto">
          {participantIds.map(id => (
            <CameraTile key={id} participantId={id} />
          ))}
        </div>
      </div>
    );
  };

  if (meetingState === 'joining-meeting') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Connecting to meeting...</p>
        </div>
      </div>
    );
  }

  if (meetingState === 'left-meeting' || meetingState === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-lg mb-4">Meeting ended</p>
          <Button onClick={onLeave}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* DailyAudio component for handling all audio */}
      <DailyAudio />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-lg font-semibold">
              {otherUserName ? `Meeting with ${otherUserName}` : 'Meeting Room'}
            </h1>
            {meetingDescription && (
              <p className="text-sm text-gray-500">{meetingDescription}</p>
            )}
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{participantIds.length} participant{participantIds.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Main content with video */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div 
          ref={videoContainerRef}
          className="w-full p-4 overflow-hidden"
        >
          {screens.length > 0 ? (
            renderScreenShare()
          ) : (
            <div className={`
              grid gap-4 h-full
              ${participantIds.length === 1 ? 'grid-cols-1' : 
                participantIds.length === 2 ? 'grid-cols-2' : 
                participantIds.length <= 4 ? 'grid-cols-2 grid-rows-2' : 
                'grid-cols-3 grid-rows-3'}
            `}>
              {participantIds.map(renderParticipant)}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-t px-4 py-4">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant={!localParticipant?.audio ? "destructive" : "outline"}
            size="lg"
            onClick={toggleAudio}
            className="w-12 h-12 rounded-full p-0"
          >
            {!localParticipant?.audio ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          <Button
            variant={!localParticipant?.video ? "destructive" : "outline"}
            size="lg"
            onClick={toggleVideo}
            className="w-12 h-12 rounded-full p-0"
          >
            {!localParticipant?.video ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </Button>

          <Button
            variant={isSharingScreen ? "default" : "outline"}
            size="lg"
            onClick={toggleScreenShare}
            className="w-12 h-12 rounded-full p-0"
          >
            <Monitor className="w-5 h-5" />
          </Button>

          <Button
            variant={showNotes ? "default" : "outline"}
            size="lg"
            onClick={() => setShowNotes(!showNotes)}
            className="w-12 h-12 rounded-full p-0"
            title="Toggle Notes"
          >
            <StickyNote className="w-5 h-5" />
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={leaveMeeting}
            className="w-12 h-12 rounded-full p-0"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Meeting Notes Sidebar */}
      <MeetingNotesSidebar
        meetingId={meetingId}
        userId={userId}
        userName={userName}
        isVisible={showNotes}
        onToggle={() => setShowNotes(!showNotes)}
      />
    </div>
  );
}

// Participant tile component
function ParticipantTile({ 
  participantId, 
  isLocal, 
  hasScreenShare 
}: { 
  participantId: string; 
  isLocal: boolean; 
  hasScreenShare: boolean;
}) {
  const participant = useParticipant(participantId);
  
  if (!participant) return null;

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${
      isLocal ? 'border-2 border-blue-500' : 'border border-gray-600'
    }`}>
      <div className="daily-video-container">
        <DailyVideo sessionId={participantId} type="video" />
      </div>
      
      {/* Participant info overlay */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
        {participant.user_name || 'Anonymous'} {isLocal && '(You)'}
      </div>

      {/* Audio muted indicator */}
      {!participant.audio && (
        <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
          <MicOff className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Video off indicator */}
      {!participant.video && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center text-white">
            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm opacity-75">Camera off</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Camera tile for screen share sidebar
function CameraTile({ participantId }: { participantId: string }) {
  const participant = useParticipant(participantId);
  const localParticipant = useLocalParticipant();
  const isLocal = participantId === localParticipant?.session_id;
  
  if (!participant) return null;

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden daily-camera-box ${
      isLocal ? 'border-2 border-blue-500' : 'border border-gray-600'
    }`}>
      <div className="daily-video-container">
        <DailyVideo sessionId={participantId} type="video" />
      </div>
      
      {/* Participant name */}
      <div className="absolute bottom-1 left-1 bg-black bg-opacity-75 text-white px-1 py-0.5 rounded text-xs">
        {participant.user_name || 'Anonymous'} {isLocal && '(You)'}
      </div>

      {/* Audio muted indicator */}
      {!participant.audio && (
        <div className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5">
          <MicOff className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Video off indicator */}
      {!participant.video && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}

// Main component with DailyProvider
export default function DailyMeeting({ 
  roomUrl, 
  onLeave, 
  meetingId, 
  userName,
  userId, 
  otherUserName, 
  meetingDescription 
}: DailyMeetingProps) {
  const [callObject, setCallObject] = useState<any>(null);

  useEffect(() => {
    import('@daily-co/daily-js').then((DailyIframe) => {
      const call = DailyIframe.default.createCallObject();
      setCallObject(call);

      // Join the meeting
      call.join({
        url: roomUrl,
        userName: userName || 'Anonymous User',
      }).catch((error: any) => {
        console.error('Failed to join meeting:', error);
      });

      return () => {
        call.destroy();
      };
    });
  }, [roomUrl, userName]);

  if (!callObject) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Initializing meeting...</p>
        </div>
      </div>
    );
  }

  return (
    <DailyProvider callObject={callObject}>
      <DailyMeetingInner
        onLeave={onLeave}
        meetingId={meetingId}
        userName={userName}
        userId={userId}
        otherUserName={otherUserName}
        meetingDescription={meetingDescription}
      />
    </DailyProvider>
  );
}
