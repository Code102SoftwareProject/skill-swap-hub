'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Daily, { DailyCall, DailyEventObject, DailyParticipantsObject, DailyParticipant } from '@daily-co/daily-js';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  PhoneOff, 
  Monitor, 
  Settings, 
  Users, 
  Maximize2,
  Minimize2 
} from 'lucide-react';

// Global singleton to prevent duplicate Daily instances
let globalDailyInstance: DailyCall | null = null;
let instanceRefCount = 0;

interface DailyMeetingProps {
  roomUrl: string;
  onLeave?: () => void;
  meetingId?: string;
  userName?: string;
}

export default function DailyMeeting({ roomUrl, onLeave, meetingId, userName }: DailyMeetingProps) {
  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Daily.js State
  const callRef = useRef<DailyCall | null>(null);
  const isInitialized = useRef(false);
  const [participants, setParticipants] = useState<DailyParticipantsObject>({} as DailyParticipantsObject);
  const [isJoined, setIsJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Initialize Daily call object with singleton pattern
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      
      // Use global instance if it exists, otherwise create new one
      if (!globalDailyInstance) {
        console.log('Creating new Daily call object...');
        try {
          globalDailyInstance = Daily.createCallObject({
            audioSource: true,
            videoSource: true,
          });
        } catch (error) {
          console.error('Failed to create Daily call object:', error);
          setError('Failed to initialize video calling. Please refresh the page.');
          return;
        }
      } else {
        console.log('Reusing existing Daily call object...');
      }
      
      callRef.current = globalDailyInstance;
      instanceRefCount++;

      // Set up event listeners
      const call = callRef.current;

      // Joined meeting
      call.on('joined-meeting', (event: DailyEventObject) => {
        console.log('Successfully joined meeting', event);
        setIsJoined(true);
        setIsConnecting(false);
        setError(null);
        
        const currentParticipants = call.participants();
        setParticipants(currentParticipants);
        setParticipantCount(Object.keys(currentParticipants).length);
      });

      // Left meeting
      call.on('left-meeting', () => {
        console.log('Left meeting');
        setIsJoined(false);
        setParticipants({} as DailyParticipantsObject);
        setParticipantCount(0);
        setError(null);
        setIsAudioMuted(false);
        setIsVideoMuted(false);
        setIsScreenSharing(false);
      });

      // Participant updates
      const handleParticipantUpdate = () => {
        const currentParticipants = call.participants();
        setParticipants(currentParticipants);
        setParticipantCount(Object.keys(currentParticipants).length);
        
        // Update local participant states
        const localParticipant = Object.values(currentParticipants).find(p => p.local);
        if (localParticipant) {
          setIsAudioMuted(!localParticipant.tracks.audio?.state || localParticipant.tracks.audio.state !== 'playable');
          setIsVideoMuted(!localParticipant.tracks.video?.state || localParticipant.tracks.video.state !== 'playable');
          setIsScreenSharing(!!localParticipant.tracks.screenVideo?.state && localParticipant.tracks.screenVideo.state === 'playable');
        }
      };

      call.on('participant-joined', handleParticipantUpdate);
      call.on('participant-updated', handleParticipantUpdate);
      call.on('participant-left', handleParticipantUpdate);

      // Error handling
      call.on('error', (event: DailyEventObject) => {
        console.error('Daily error:', event);
        setError(event.errorMsg || 'An error occurred during the meeting');
        setIsConnecting(false);
      });

      call.on('camera-error', (event: DailyEventObject) => {
        console.error('Camera error:', event);
        setError('Camera access failed. Please check your camera permissions.');
      });

      // Add window beforeunload cleanup
      const handleBeforeUnload = () => {
        if (globalDailyInstance) {
          console.log('Window unloading, cleaning up Daily instance...');
          try {
            globalDailyInstance.destroy();
          } catch (error) {
            console.error('Error cleaning up on window unload:', error);
          }
          globalDailyInstance = null;
          instanceRefCount = 0;
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      // Cleanup function for removing the beforeunload listener
      const cleanup = () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };

      return cleanup;
    }

    return () => {
      if (callRef.current && isInitialized.current) {
        instanceRefCount--;
        console.log('Component unmounting, ref count:', instanceRefCount);
        
        // Remove beforeunload listener
        const handleBeforeUnload = () => {
          if (globalDailyInstance) {
            console.log('Window unloading, cleaning up Daily instance...');
            try {
              globalDailyInstance.destroy();
            } catch (error) {
              console.error('Error cleaning up on window unload:', error);
            }
            globalDailyInstance = null;
            instanceRefCount = 0;
          }
        };
        window.removeEventListener('beforeunload', handleBeforeUnload);
        
        // Only destroy if this is the last instance
        if (instanceRefCount <= 0) {
          console.log('Destroying Daily call object...');
          try {
            callRef.current.destroy();
          } catch (error) {
            console.error('Error destroying Daily call:', error);
          }
          globalDailyInstance = null;
          instanceRefCount = 0;
        }
        
        callRef.current = null;
        isInitialized.current = false;
      }
    };
  }, []);

  // Join meeting function
  const joinMeeting = useCallback(async (url: string) => {
    if (!callRef.current || !url) return;

    try {
      setIsConnecting(true);
      setError(null);
      console.log('Joining meeting:', url);

      await callRef.current.join({
        url: url,
        userName: userName || 'Anonymous User',
      });
    } catch (err) {
      console.error('Failed to join meeting:', err);
      setError('Failed to join meeting. Please try again.');
      setIsConnecting(false);
    }
  }, [userName]);

  // Leave meeting function
  const leaveMeeting = useCallback(async () => {
    if (!callRef.current) return;

    try {
      console.log('Leaving meeting...');
      await callRef.current.leave();
    } catch (err) {
      console.error('Failed to leave meeting:', err);
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    if (!callRef.current) return;

    try {
      const newMutedState = !isAudioMuted;
      await callRef.current.setLocalAudio(!newMutedState);
      setIsAudioMuted(newMutedState);
    } catch (err) {
      console.error('Failed to toggle audio:', err);
    }
  }, [isAudioMuted]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (!callRef.current) return;

    try {
      const newMutedState = !isVideoMuted;
      await callRef.current.setLocalVideo(!newMutedState);
      setIsVideoMuted(newMutedState);
    } catch (err) {
      console.error('Failed to toggle video:', err);
    }
  }, [isVideoMuted]);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    if (!callRef.current) return;

    try {
      if (isScreenSharing) {
        await callRef.current.stopScreenShare();
      } else {
        await callRef.current.startScreenShare();
      }
      setIsScreenSharing(!isScreenSharing);
    } catch (err) {
      console.error('Failed to toggle screen share:', err);
      setError('Screen sharing failed. Please try again.');
    }
  }, [isScreenSharing]);

  // Auto-join meeting when component mounts
  useEffect(() => {
    if (roomUrl && !isJoined && !isConnecting) {
      joinMeeting(roomUrl);
    }
  }, [roomUrl, isJoined, isConnecting, joinMeeting]);

  // Handle leaving the meeting
  const handleLeaveMeeting = useCallback(async () => {
    await leaveMeeting();
    if (onLeave) {
      onLeave();
    }
  }, [leaveMeeting, onLeave]);

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

  // Render participant video
  const renderParticipantVideo = (participant: DailyParticipant) => {
    const { session_id, local, tracks, user_name } = participant;
    const videoTrack = tracks.video;
    const screenTrack = tracks.screenVideo;
    
    return (
      <div
        key={session_id}
        className={`relative bg-gray-900 rounded-lg overflow-hidden ${
          local ? 'border-2 border-blue-500' : 'border border-gray-600'
        }`}
      >
        {/* Video element */}
        <video
          ref={(video) => {
            if (video && videoTrack?.persistentTrack) {
              video.srcObject = new MediaStream([videoTrack.persistentTrack]);
              video.play().catch(console.error);
            }
          }}
          autoPlay
          muted={local} // Mute local video to prevent echo
          playsInline
          className={`w-full h-full object-cover ${
            videoTrack?.state === 'playable' ? 'block' : 'hidden'
          }`}
        />

        {/* Screen share video */}
        {screenTrack?.persistentTrack && (
          <video
            ref={(video) => {
              if (video && screenTrack.persistentTrack) {
                video.srcObject = new MediaStream([screenTrack.persistentTrack]);
                video.play().catch(console.error);
              }
            }}
            autoPlay
            muted={local}
            playsInline
            className="w-full h-full object-contain"
          />
        )}

        {/* Audio element for remote participants */}
        {!local && tracks.audio?.persistentTrack && (
          <audio
            ref={(audio) => {
              if (audio && tracks.audio?.persistentTrack) {
                audio.srcObject = new MediaStream([tracks.audio.persistentTrack]);
                audio.play().catch(console.error);
              }
            }}
            autoPlay
            playsInline
          />
        )}

        {/* Participant info overlay */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {user_name || 'Anonymous'} {local && '(You)'}
        </div>

        {/* Video off indicator */}
        {(!videoTrack || videoTrack.state !== 'playable') && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center text-white">
              <VideoOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm opacity-75">Camera off</p>
            </div>
          </div>
        )}

        {/* Audio muted indicator */}
        {tracks.audio?.state !== 'playable' && (
          <div className="absolute top-2 right-2">
            <MicOff className="w-5 h-5 text-red-500" />
          </div>
        )}
      </div>
    );
  };

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Connecting to meeting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">Meeting Room</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Video Grid */}
      <div 
        ref={videoContainerRef}
        className="flex-1 p-4 overflow-hidden"
      >
        <div className={`
          grid gap-4 h-full
          ${Object.keys(participants).length === 1 ? 'grid-cols-1' : 
            Object.keys(participants).length === 2 ? 'grid-cols-2' : 
            Object.keys(participants).length <= 4 ? 'grid-cols-2 grid-rows-2' : 
            'grid-cols-3 grid-rows-3'}
        `}>
          {Object.values(participants).map(renderParticipantVideo)}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-t px-4 py-4">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant={isAudioMuted ? "destructive" : "outline"}
            size="lg"
            onClick={toggleAudio}
            className="w-12 h-12 rounded-full p-0"
          >
            {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          <Button
            variant={isVideoMuted ? "destructive" : "outline"}
            size="lg"
            onClick={toggleVideo}
            className="w-12 h-12 rounded-full p-0"
          >
            {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </Button>

          <Button
            variant={isScreenSharing ? "default" : "outline"}
            size="lg"
            onClick={toggleScreenShare}
            className="w-12 h-12 rounded-full p-0"
          >
            <Monitor className="w-5 h-5" />
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={handleLeaveMeeting}
            className="w-12 h-12 rounded-full p-0"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}

// Export cleanup function for emergency cleanup
export const cleanupDailyInstance = () => {
  if (globalDailyInstance) {
    console.log('Force cleaning up Daily instance...');
    try {
      globalDailyInstance.destroy();
    } catch (error) {
      console.error('Error force cleaning Daily instance:', error);
    }
    globalDailyInstance = null;
    instanceRefCount = 0;
  }
};
