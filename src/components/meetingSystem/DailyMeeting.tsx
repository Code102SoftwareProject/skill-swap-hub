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

// Add custom styles for video containers
const videoStyles = `
  .screen-share-main video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }
  
  .participant-video video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .camera-box {
    min-width: 128px;
    min-height: 96px;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = videoStyles;
  document.head.appendChild(styleSheet);
}

// Global singleton to prevent duplicate Daily instances
let globalDailyInstance: DailyCall | null = null;
let instanceRefCount = 0;

interface DailyMeetingProps {
  roomUrl: string;
  onLeave?: () => void;
  meetingId?: string;
  userName?: string;
  otherUserName?: string;
  meetingDescription?: string;
}

export default function DailyMeeting({ roomUrl, onLeave, meetingId, userName, otherUserName, meetingDescription }: DailyMeetingProps) {
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
        
        // Force video refresh to ensure proper display
        setTimeout(() => {
          const videos = document.querySelectorAll('video');
          videos.forEach(video => {
            if (video.srcObject && video.paused) {
              video.play().catch(console.error);
            }
          });
        }, 100);
      };

      // Also update states when joining
      call.on('joined-meeting', (event: DailyEventObject) => {
        console.log('Successfully joined meeting', event);
        setIsJoined(true);
        setIsConnecting(false);
        setError(null);
        
        const currentParticipants = call.participants();
        setParticipants(currentParticipants);
        setParticipantCount(Object.keys(currentParticipants).length);
        
        // Initialize local participant states
        const localParticipant = Object.values(currentParticipants).find(p => p.local);
        if (localParticipant) {
          setIsAudioMuted(!call.localAudio());
          setIsVideoMuted(!call.localVideo());
          setIsScreenSharing(false); // Screen sharing starts as false
        }
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

      // Screen share events with immediate UI updates
      call.on('local-screen-share-started', () => {
        console.log('Local screen sharing started');
        setIsScreenSharing(true);
        // Force immediate participant update
        setTimeout(() => {
          const currentParticipants = call.participants();
          setParticipants(currentParticipants);
          setParticipantCount(Object.keys(currentParticipants).length);
        }, 100);
      });

      call.on('local-screen-share-stopped', () => {
        console.log('Local screen sharing stopped');
        setIsScreenSharing(false);
        // Force immediate participant update
        setTimeout(() => {
          const currentParticipants = call.participants();
          setParticipants(currentParticipants);
          setParticipantCount(Object.keys(currentParticipants).length);
        }, 100);
      });

      // Remote screen share events - improved detection
      call.on('track-started', (event: DailyEventObject) => {
        console.log('Track started', event);
        if (event.track?.kind === 'video' && (event.participant?.screen || event.track?.label?.includes('screen'))) {
          console.log('Remote screen sharing started');
          // Force immediate participant update
          setTimeout(() => {
            const currentParticipants = call.participants();
            setParticipants(currentParticipants);
            setParticipantCount(Object.keys(currentParticipants).length);
          }, 100);
        }
      });

      call.on('track-stopped', (event: DailyEventObject) => {
        console.log('Track stopped', event);
        if (event.track?.kind === 'video' && (event.participant?.screen || event.track?.label?.includes('screen'))) {
          console.log('Remote screen sharing stopped');
          // Force immediate participant update
          setTimeout(() => {
            const currentParticipants = call.participants();
            setParticipants(currentParticipants);
            setParticipantCount(Object.keys(currentParticipants).length);
          }, 100);
        }
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

      // Periodic state refresh to ensure UI stays in sync
      const stateRefreshInterval = setInterval(() => {
        if (call && call.meetingState() === 'joined-meeting') {
          try {
            const currentParticipants = call.participants();
            const participantKeys = Object.keys(currentParticipants);
            
            // Always update to ensure UI is in sync
            console.log('Periodic state refresh - updating participants');
            setParticipants(currentParticipants);
            setParticipantCount(participantKeys.length);
            
            // Update local participant states
            const localParticipant = Object.values(currentParticipants).find(p => p.local);
            if (localParticipant) {
              const currentAudioMuted = !localParticipant.tracks.audio?.state || localParticipant.tracks.audio.state !== 'playable';
              const currentVideoMuted = !localParticipant.tracks.video?.state || localParticipant.tracks.video.state !== 'playable';
              const currentScreenSharing = !!localParticipant.tracks.screenVideo?.state && localParticipant.tracks.screenVideo.state === 'playable';
              
              setIsAudioMuted(currentAudioMuted);
              setIsVideoMuted(currentVideoMuted);
              setIsScreenSharing(currentScreenSharing);
            }
            
            // Force video refresh to ensure all videos are playing
            setTimeout(() => {
              const videos = document.querySelectorAll('video');
              videos.forEach(video => {
                if (video.srcObject && video.paused) {
                  video.play().catch(console.error);
                }
              });
              
              const audios = document.querySelectorAll('audio');
              audios.forEach(audio => {
                if (audio.srcObject && audio.paused) {
                  audio.play().catch(console.error);
                }
              });
            }, 200);
          } catch (error) {
            console.error('Error during periodic state refresh:', error);
          }
        }
      }, 1000); // Refresh every second

      // Cleanup function for removing the beforeunload listener and interval
      const cleanup = () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        clearInterval(stateRefreshInterval);
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
      const currentState = callRef.current.localAudio();
      await callRef.current.setLocalAudio(!currentState);
      setIsAudioMuted(!currentState);
    } catch (err) {
      console.error('Failed to toggle audio:', err);
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (!callRef.current) return;

    try {
      const currentState = callRef.current.localVideo();
      await callRef.current.setLocalVideo(!currentState);
      setIsVideoMuted(!currentState);
    } catch (err) {
      console.error('Failed to toggle video:', err);
    }
  }, []);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    if (!callRef.current) return;

    try {
      if (isScreenSharing) {
        await callRef.current.stopScreenShare();
        setIsScreenSharing(false);
      } else {
        await callRef.current.startScreenShare();
        setIsScreenSharing(true);
      }
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
  const renderParticipantVideo = (participant: DailyParticipant, isScreenShareActive: boolean = false) => {
    const { session_id, local, tracks, user_name } = participant;
    const videoTrack = tracks.video;
    const screenTrack = tracks.screenVideo;
    const audioTrack = tracks.audio;
    
    // Check if this participant is sharing screen
    const isThisParticipantSharingScreen = !!screenTrack?.persistentTrack && screenTrack?.state === 'playable';
    
    return (
      <div
        key={session_id}
        className={`relative bg-gray-900 rounded-lg overflow-hidden participant-video ${
          local ? 'border-2 border-blue-500' : 'border border-gray-600'
        } ${isThisParticipantSharingScreen && isScreenShareActive ? 'screen-share-main' : ''}`}
      >
        {/* Screen share video (prioritized when sharing) */}
        {isThisParticipantSharingScreen && (
          <video
            ref={(video) => {
              if (video && screenTrack?.persistentTrack) {
                try {
                  const mediaStream = new MediaStream([screenTrack.persistentTrack]);
                  if (video.srcObject !== mediaStream) {
                    video.srcObject = mediaStream;
                  }
                  if (video.paused) {
                    video.play().catch(console.error);
                  }
                } catch (error) {
                  console.error('Error setting screen share source:', error);
                }
              }
            }}
            autoPlay
            muted={local}
            playsInline
            className="w-full h-full object-contain bg-black"
            onLoadedMetadata={(e) => {
              const video = e.target as HTMLVideoElement;
              video.play().catch(console.error);
            }}
          />
        )}

        {/* Camera video (shown when not screen sharing or as small overlay) */}
        {(!isThisParticipantSharingScreen || !isScreenShareActive) && videoTrack?.persistentTrack && videoTrack?.state === 'playable' && (
          <video
            ref={(video) => {
              if (video && videoTrack.persistentTrack) {
                try {
                  const mediaStream = new MediaStream([videoTrack.persistentTrack]);
                  if (video.srcObject !== mediaStream) {
                    video.srcObject = mediaStream;
                  }
                  if (video.paused) {
                    video.play().catch(console.error);
                  }
                } catch (error) {
                  console.error('Error setting video source:', error);
                }
              }
            }}
            autoPlay
            muted={local}
            playsInline
            className="w-full h-full object-cover"
            onLoadedMetadata={(e) => {
              const video = e.target as HTMLVideoElement;
              video.play().catch(console.error);
            }}
          />
        )}

        {/* Audio element for remote participants */}
        {!local && audioTrack?.persistentTrack && audioTrack?.state === 'playable' && (
          <audio
            ref={(audio) => {
              if (audio && audioTrack.persistentTrack) {
                try {
                  const mediaStream = new MediaStream([audioTrack.persistentTrack]);
                  if (audio.srcObject !== mediaStream) {
                    audio.srcObject = mediaStream;
                  }
                  if (audio.paused) {
                    audio.play().catch(console.error);
                  }
                } catch (error) {
                  console.error('Error setting audio source:', error);
                }
              }
            }}
            autoPlay
            playsInline
            onLoadedMetadata={(e) => {
              const audio = e.target as HTMLAudioElement;
              audio.play().catch(console.error);
            }}
          />
        )}

        {/* Screen share indicator */}
        {isThisParticipantSharingScreen && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center">
            <Monitor className="w-3 h-3 mr-1" />
            Screen Share
          </div>
        )}

        {/* Participant info overlay */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
          {user_name || 'Anonymous'} {local && '(You)'}
        </div>

        {/* Video off indicator */}
        {(!isThisParticipantSharingScreen && (!videoTrack || videoTrack.state !== 'playable')) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center text-white">
              <VideoOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm opacity-75">Camera off</p>
            </div>
          </div>
        )}

        {/* Audio muted indicator */}
        {(!audioTrack || audioTrack.state !== 'playable') && (
          <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
            <MicOff className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    );
  };

  // Create a separate component for camera-only participants during screen share
  const renderCameraBox = (participant: DailyParticipant) => {
    const { session_id, local, tracks, user_name } = participant;
    const videoTrack = tracks.video;
    const audioTrack = tracks.audio;
    
    return (
      <div
        key={`camera-${session_id}`}
        className={`relative bg-gray-900 rounded-lg overflow-hidden w-32 h-24 ${
          local ? 'border-2 border-blue-500' : 'border border-gray-600'
        } camera-box`}
      >
        {/* Camera video */}
        {videoTrack?.persistentTrack && videoTrack?.state === 'playable' && (
          <video
            ref={(video) => {
              if (video && videoTrack.persistentTrack) {
                try {
                  const mediaStream = new MediaStream([videoTrack.persistentTrack]);
                  if (video.srcObject !== mediaStream) {
                    video.srcObject = mediaStream;
                  }
                  if (video.paused) {
                    video.play().catch(console.error);
                  }
                } catch (error) {
                  console.error('Error setting camera box video source:', error);
                }
              }
            }}
            autoPlay
            muted={local}
            playsInline
            className="w-full h-full object-cover"
            onLoadedMetadata={(e) => {
              const video = e.target as HTMLVideoElement;
              video.play().catch(console.error);
            }}
          />
        )}

        {/* Audio element for remote participants */}
        {!local && audioTrack?.persistentTrack && audioTrack?.state === 'playable' && (
          <audio
            ref={(audio) => {
              if (audio && audioTrack.persistentTrack) {
                try {
                  const mediaStream = new MediaStream([audioTrack.persistentTrack]);
                  if (audio.srcObject !== mediaStream) {
                    audio.srcObject = mediaStream;
                  }
                  if (audio.paused) {
                    audio.play().catch(console.error);
                  }
                } catch (error) {
                  console.error('Error setting camera box audio source:', error);
                }
              }
            }}
            autoPlay
            playsInline
            onLoadedMetadata={(e) => {
              const audio = e.target as HTMLAudioElement;
              audio.play().catch(console.error);
            }}
          />
        )}

        {/* Participant name */}
        <div className="absolute bottom-1 left-1 bg-black bg-opacity-75 text-white px-1 py-0.5 rounded text-xs">
          {user_name || 'Anonymous'} {local && '(You)'}
        </div>

        {/* Video off indicator */}
        {(!videoTrack || videoTrack.state !== 'playable') && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <VideoOff className="w-4 h-4 text-white opacity-50" />
          </div>
        )}

        {/* Audio muted indicator */}
        {(!audioTrack || audioTrack.state !== 'playable') && (
          <div className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5">
            <MicOff className="w-3 h-3 text-white" />
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
        {/* Check if anyone is screen sharing */}
        {(() => {
          const participantList = Object.values(participants);
          const screenSharingParticipant = participantList.find(p => 
            p.tracks.screenVideo?.persistentTrack && p.tracks.screenVideo?.state === 'playable'
          );
          
          if (screenSharingParticipant) {
            // Screen sharing layout
            return (
              <div className="flex h-full gap-4">
                {/* Main screen share area */}
                <div className="flex-1">
                  {renderParticipantVideo(screenSharingParticipant, true)}
                </div>
                
                {/* Camera videos sidebar */}
                <div className="w-40 flex flex-col gap-2 overflow-y-auto">
                  {participantList.map(participant => renderCameraBox(participant))}
                </div>
              </div>
            );
          } else {
            // Normal grid layout
            return (
              <div className={`
                grid gap-4 h-full
                ${participantList.length === 1 ? 'grid-cols-1' : 
                  participantList.length === 2 ? 'grid-cols-2' : 
                  participantList.length <= 4 ? 'grid-cols-2 grid-rows-2' : 
                  'grid-cols-3 grid-rows-3'}
              `}>
                {participantList.map(participant => renderParticipantVideo(participant, false))}
              </div>
            );
          }
        })()}
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
