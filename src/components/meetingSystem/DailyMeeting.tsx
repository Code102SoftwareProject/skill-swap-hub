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
    min-width: 100px;
    min-height: 75px;
    aspect-ratio: 4/3;
  }
  
  @media (min-width: 768px) {
    .daily-camera-box {
      min-width: 128px;
      min-height: 96px;
    }
  }
  
  @media (max-width: 767px) {
    .daily-camera-box {
      flex-shrink: 0;
    }
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

  // Meeting control functions with enhanced error handling
  const toggleAudio = useCallback(async () => {
    if (!daily) return;
    
    try {
      await daily.setLocalAudio(!localParticipant?.audio);
    } catch (error) {
      console.error('Audio toggle failed:', error);
      // Show user-friendly error message
      alert('Unable to access microphone. It might be in use by another application.');
    }
  }, [daily, localParticipant?.audio]);

  const toggleVideo = useCallback(async () => {
    if (!daily) return;
    
    try {
      await daily.setLocalVideo(!localParticipant?.video);
    } catch (error) {
      console.error('Video toggle failed:', error);
      // Show user-friendly error message
      alert('Unable to access camera. It might be in use by another browser tab or application.');
    }
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

  // Function to join meeting with fallback options
  const joinMeetingWithFallback = useCallback(async () => {
    if (!daily) return;

    try {
      // First try with camera and microphone
      await daily.setLocalVideo(true);
      await daily.setLocalAudio(true);
    } catch (error) {
      console.warn('Could not enable camera/microphone, trying audio-only mode:', error);
      try {
        // Fallback to audio-only if camera fails
        await daily.setLocalVideo(false);
        await daily.setLocalAudio(true);
      } catch (audioError) {
        console.warn('Audio also failed, joining in listen-only mode:', audioError);
        // Last resort: join without any media
        await daily.setLocalVideo(false);
        await daily.setLocalAudio(false);
      }
    }
  }, [daily]);

  // Call this when meeting state changes to joined
  useEffect(() => {
    if (meetingState === 'joined-meeting') {
      joinMeetingWithFallback();
    }
  }, [meetingState, joinMeetingWithFallback]);

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
      <div className="flex flex-col lg:flex-row h-full gap-2 md:gap-4">
        {/* Main screen share area */}
        <div className="flex-1 relative bg-gray-900 rounded-lg overflow-hidden min-h-[200px]">
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
        <div className="w-full lg:w-32 xl:w-40 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:overflow-x-visible">
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
      <div className="bg-white shadow-sm border-b px-2 md:px-4 py-2 md:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div className="min-w-0 flex-1">
            <h1 className="text-base md:text-lg font-semibold truncate">
              {otherUserName ? `Meeting with ${otherUserName}` : 'Meeting Room'}
            </h1>
            {meetingDescription && (
              <p className="text-xs md:text-sm text-gray-500 truncate">{meetingDescription}</p>
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-600 shrink-0">
            <Users className="w-3 h-3 md:w-4 md:h-4" />
            <span>{participantIds.length} participant{participantIds.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="text-xs px-2 py-1"
          >
            {isFullscreen ? <Minimize className="w-3 h-3 md:w-4 md:h-4" /> : <Maximize className="w-3 h-3 md:w-4 md:h-4" />}
          </Button>
        </div>
      </div>

      {/* Main content with video */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div 
          ref={videoContainerRef}
          className="w-full p-2 md:p-4 overflow-hidden"
        >
          {screens.length > 0 ? (
            renderScreenShare()
          ) : (
            <div className={`
              grid gap-2 md:gap-4 h-full
              ${participantIds.length === 1 ? 'grid-cols-1' : 
                participantIds.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 
                participantIds.length <= 4 ? 'grid-cols-1 sm:grid-cols-2' : 
                'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}
            `}>
              {participantIds.map(renderParticipant)}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-t px-2 md:px-4 py-3 md:py-4">
        <div className="flex items-center justify-center space-x-3 md:space-x-4">
          <Button
            variant={!localParticipant?.audio ? "destructive" : "outline"}
            size="lg"
            onClick={toggleAudio}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full p-0"
          >
            {!localParticipant?.audio ? <MicOff className="w-4 h-4 md:w-5 md:h-5" /> : <Mic className="w-4 h-4 md:w-5 md:h-5" />}
          </Button>

          <Button
            variant={!localParticipant?.video ? "destructive" : "outline"}
            size="lg"
            onClick={toggleVideo}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full p-0"
          >
            {!localParticipant?.video ? <VideoOff className="w-4 h-4 md:w-5 md:h-5" /> : <Video className="w-4 h-4 md:w-5 md:h-5" />}
          </Button>

          <Button
            variant={isSharingScreen ? "default" : "outline"}
            size="lg"
            onClick={toggleScreenShare}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full p-0"
          >
            <Monitor className="w-4 h-4 md:w-5 md:h-5" />
          </Button>

          <Button
            variant={showNotes ? "default" : "outline"}
            size="lg"
            onClick={() => setShowNotes(!showNotes)}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full p-0"
            title="Toggle Notes"
          >
            <StickyNote className="w-4 h-4 md:w-5 md:h-5" />
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={leaveMeeting}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full p-0"
          >
            <PhoneOff className="w-4 h-4 md:w-5 md:h-5" />
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
      <div className="absolute bottom-1 md:bottom-2 left-1 md:left-2 bg-black bg-opacity-75 text-white px-1 md:px-2 py-0.5 md:py-1 rounded text-xs md:text-sm">
        {participant.user_name || 'Anonymous'} {isLocal && '(You)'}
      </div>

      {/* Audio muted indicator */}
      {!participant.audio && (
        <div className="absolute top-1 md:top-2 right-1 md:right-2 bg-red-500 rounded-full p-0.5 md:p-1">
          <MicOff className="w-3 h-3 md:w-4 md:h-4 text-white" />
        </div>
      )}

      {/* Video off indicator */}
      {!participant.video && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center text-white">
            <div className="w-8 h-8 md:w-12 md:h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-1 md:mb-2">
              <Users className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <p className="text-xs md:text-sm opacity-75">Camera off</p>
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
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden daily-camera-box min-w-[100px] lg:min-w-[128px] ${
      isLocal ? 'border-2 border-blue-500' : 'border border-gray-600'
    }`}>
      <div className="daily-video-container">
        <DailyVideo sessionId={participantId} type="video" />
      </div>
      
      {/* Participant name */}
      <div className="absolute bottom-0.5 left-0.5 md:bottom-1 md:left-1 bg-black bg-opacity-75 text-white px-1 py-0.5 rounded text-xs">
        {participant.user_name || 'Anonymous'} {isLocal && '(You)'}
      </div>

      {/* Audio muted indicator */}
      {!participant.audio && (
        <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 bg-red-500 rounded-full p-0.5">
          <MicOff className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
        </div>
      )}

      {/* Video off indicator */}
      {!participant.video && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <Users className="w-3 h-3 md:w-4 md:h-4 text-white" />
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
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    import('@daily-co/daily-js').then((DailyIframe) => {
      if (!isMounted) return;
      
      const call = DailyIframe.default.createCallObject({
        // Enhanced configuration for better device handling
        videoSource: 'camera',
        audioSource: 'microphone',
        // Try to gracefully handle device conflicts
        startVideoOff: false,
        startAudioOff: false,
      });

      // Listen for join events
      call.on('joined-meeting', () => {
        if (isMounted) {
          setIsJoining(false);
          setJoinError(null);
        }
      });

      call.on('error', (error: any) => {
        if (isMounted) {
          console.error('Daily meeting error:', error);
          setIsJoining(false);
          
          // Handle specific error types
          if (error.type === 'cam-in-use' || error.errorMsg?.includes('camera')) {
            setJoinError('Camera is already in use by another tab or application. Please close other video calls and try again.');
          } else if (error.type === 'mic-in-use' || error.errorMsg?.includes('microphone')) {
            setJoinError('Microphone is already in use by another tab or application. Please close other audio calls and try again.');
          } else if (error.errorMsg?.includes('Permission denied')) {
            setJoinError('Camera and microphone access denied. Please allow permissions and refresh the page.');
          } else {
            setJoinError('Failed to join meeting. Please try again or check your connection.');
          }
        }
      });

      setCallObject(call);

      // Join the meeting with enhanced error handling
      call.join({
        url: roomUrl,
        userName: userName || 'Anonymous User',
      }).catch((error: any) => {
        if (isMounted) {
          console.error('Failed to join meeting:', error);
          setIsJoining(false);
          
          // Parse error messages for better user feedback
          const errorMessage = error.message || error.toString();
          if (errorMessage.includes('camera') || errorMessage.includes('video')) {
            setJoinError('Camera access failed. Another browser tab might be using your camera. Please close other video calls and try again.');
          } else if (errorMessage.includes('microphone') || errorMessage.includes('audio')) {
            setJoinError('Microphone access failed. Another application might be using your microphone.');
          } else if (errorMessage.includes('permission')) {
            setJoinError('Please allow camera and microphone permissions to join the meeting.');
          } else {
            setJoinError('Unable to connect to the meeting. Please check your internet connection and try again.');
          }
        }
      });

      return () => {
        if (call && !call.isDestroyed()) {
          call.destroy();
        }
      };
    });

    return () => {
      isMounted = false;
    };
  }, [roomUrl, userName]);

  // Show error state with helpful message and retry option
  if (joinError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-8 max-w-md w-full text-center">
          <div className="mb-4 md:mb-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
              <VideoOff className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Unable to Join Meeting</h2>
            <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">{joinError}</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6 text-left">
              <h3 className="text-sm md:text-base font-semibold text-blue-900 mb-2">💡 Quick Solutions:</h3>
              <ul className="text-xs md:text-sm text-blue-800 space-y-1">
                <li>• Close other browser tabs using your camera/microphone</li>
                <li>• Close video calling apps (Zoom, Teams, Skype, etc.)</li>
                <li>• Refresh this page and allow camera permissions</li>
                <li>• Try using a different browser or incognito mode</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => {
                setJoinError(null);
                setIsJoining(true);
                window.location.reload();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-sm md:text-base"
            >
              Try Again
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onLeave}
              className="w-full text-sm md:text-base"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!callObject || isJoining) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">
            {!callObject ? 'Initializing meeting...' : 'Connecting to meeting...'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Make sure no other tabs are using your camera or microphone
          </p>
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
