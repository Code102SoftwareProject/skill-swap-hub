import { useEffect, useRef, useState, useCallback } from 'react';
import Daily, { DailyCall, DailyEventObject, DailyParticipantsObject } from '@daily-co/daily-js';

interface UseDailyMeetingOptions {
  userName?: string;
  audioSource?: boolean;
  videoSource?: boolean;
}

interface UseDailyMeetingReturn {
  call: DailyCall | null;
  participants: DailyParticipantsObject;
  isJoined: boolean;
  isConnecting: boolean;
  error: string | null;
  participantCount: number;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  joinMeeting: (roomUrl: string) => Promise<void>;
  leaveMeeting: () => Promise<void>;
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
}

// Singleton pattern for Daily call object to prevent duplicate instances
class DailyManager {
  private static instance: DailyCall | null = null;
  private static refCount: number = 0;
  private static isCreating: boolean = false;

  static async getInstance(options?: { audioSource?: boolean; videoSource?: boolean }): Promise<DailyCall | null> {
    // Prevent race conditions during creation
    if (this.isCreating) {
      // Wait for the current creation to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.instance;
    }

    if (!this.instance) {
      this.isCreating = true;
      try {
        console.log('Creating new Daily call object');
        this.instance = Daily.createCallObject({
          audioSource: options?.audioSource ?? true,
          videoSource: options?.videoSource ?? true,
        });
      } catch (error) {
        console.error('Failed to create Daily call object:', error);
        this.instance = null;
      } finally {
        this.isCreating = false;
      }
    }

    if (this.instance) {
      this.refCount++;
      console.log('Daily instance ref count:', this.refCount);
    }

    return this.instance;
  }

  static releaseInstance(): void {
    this.refCount = Math.max(0, this.refCount - 1);
    console.log('Daily instance ref count after release:', this.refCount);

    if (this.refCount === 0 && this.instance) {
      console.log('Destroying Daily call object');
      try {
        this.instance.destroy();
      } catch (error) {
        console.error('Error destroying Daily call:', error);
      }
      this.instance = null;
    }
  }

  static forceDestroy(): void {
    if (this.instance) {
      console.log('Force destroying Daily call object');
      try {
        this.instance.destroy();
      } catch (error) {
        console.error('Error force destroying Daily call:', error);
      }
      this.instance = null;
      this.refCount = 0;
    }
  }
}

export const useDailyMeeting = (options: UseDailyMeetingOptions = {}): UseDailyMeetingReturn => {
  const callRef = useRef<DailyCall | null>(null);
  const isInitializedRef = useRef(false);
  const [participants, setParticipants] = useState<DailyParticipantsObject>({} as DailyParticipantsObject);
  const [isJoined, setIsJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Initialize Daily call object using singleton pattern
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      DailyManager.getInstance({
        audioSource: options.audioSource,
        videoSource: options.videoSource,
      }).then((call) => {
        if (call) {
          callRef.current = call;

          // Setup event listeners
          const handleJoinedMeeting = (event: DailyEventObject) => {
            console.log('Successfully joined meeting', event);
            setIsJoined(true);
            setIsConnecting(false);
            setError(null);
            
            if (callRef.current) {
              const currentParticipants = callRef.current.participants();
              setParticipants(currentParticipants);
              setParticipantCount(Object.keys(currentParticipants).length);
              
              // Update audio/video mute states
              setIsAudioMuted(!callRef.current.localAudio());
              setIsVideoMuted(!callRef.current.localVideo());
            }
          };

          const handleLeftMeeting = () => {
            console.log('Left meeting');
            setIsJoined(false);
            setParticipants({} as DailyParticipantsObject);
            setParticipantCount(0);
            setError(null);
            setIsAudioMuted(false);
            setIsVideoMuted(false);
            setIsScreenSharing(false);
          };

          const handleParticipantUpdate = (event: DailyEventObject) => {
            console.log('Participant update', event);
            if (callRef.current) {
              const currentParticipants = callRef.current.participants();
              setParticipants(currentParticipants);
              setParticipantCount(Object.keys(currentParticipants).length);
            }
          };

          const handleError = (event: DailyEventObject) => {
            console.error('Daily error:', event);
            setError(event.errorMsg || 'An error occurred during the meeting');
            setIsConnecting(false);
          };

          const handleCameraError = (event: DailyEventObject) => {
            console.error('Camera error:', event);
            setError('Camera access failed. Please check your camera permissions.');
          };

          // Add event listeners
          call.on('joined-meeting', handleJoinedMeeting);
          call.on('left-meeting', handleLeftMeeting);
          call.on('participant-joined', handleParticipantUpdate);
          call.on('participant-updated', handleParticipantUpdate);
          call.on('participant-left', handleParticipantUpdate);
          call.on('error', handleError);
          call.on('camera-error', handleCameraError);
        } else {
          setError('Failed to initialize video calling. Please refresh the page.');
        }
      }).catch((err) => {
        console.error('Failed to get Daily instance:', err);
        setError('Failed to initialize video calling. Please refresh the page.');
      });
    }

    return () => {
      if (isInitializedRef.current) {
        isInitializedRef.current = false;
        DailyManager.releaseInstance();
        callRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - we want to initialize only once

  // Join meeting
  const joinMeeting = useCallback(async (roomUrl: string) => {
    if (!callRef.current || !roomUrl) return;

    try {
      setIsConnecting(true);
      setError(null);

      await callRef.current.join({
        url: roomUrl,
        userName: options.userName || 'Anonymous User',
      });
    } catch (err) {
      console.error('Failed to join meeting:', err);
      setError('Failed to join meeting. Please try again.');
      setIsConnecting(false);
    }
  }, [options.userName]);

  // Leave meeting
  const leaveMeeting = useCallback(async () => {
    if (!callRef.current) return;

    try {
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

  return {
    call: callRef.current,
    participants,
    isJoined,
    isConnecting,
    error,
    participantCount,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    joinMeeting,
    leaveMeeting,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  };
};

// Export a global cleanup function for use in app cleanup or error recovery
export const cleanupDailyInstance = () => {
  DailyManager.forceDestroy();
};
