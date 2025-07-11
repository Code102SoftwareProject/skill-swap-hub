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
  Settings, 
  Users, 
  Maximize2,
  Minimize2,
  FileText,
  Download,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface DailyMeetingProps {
  roomUrl: string;
  onLeave?: () => void;
  meetingId?: string;
  userName?: string;
  otherUserName?: string;
  meetingDescription?: string;
}

interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  sessionId: string;
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
  userName 
}: Omit<DailyMeetingProps, 'roomUrl'>) {
  // Daily React hooks
  const daily = useDaily();
  const participantIds = useParticipantIds();
  const localParticipant = useLocalParticipant();
  const meetingState = useMeetingState();
  const { screens, isSharingScreen, startScreenShare, stopScreenShare } = useScreenShare();

  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Transcript State
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(true);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [transcriptionLang, setTranscriptionLang] = useState<string>('en-US');
  const recognitionRef = useRef<any>(null);
  const isRecognitionRunning = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

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

  // Transcript functionality
  const initializeTranscription = useCallback(() => {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsRecognitionSupported(false);
      setRecognitionError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    setIsRecognitionSupported(true);
    setRecognitionError(null);

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    // @ts-ignore
    const recognition: any = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = transcriptionLang;

    // @ts-ignore
    recognition.onstart = () => {
      isRecognitionRunning.current = true;
    };
    // @ts-ignore
    recognition.onend = () => {
      isRecognitionRunning.current = false;
      setInterimTranscript('');
      // Auto-restart if still transcribing and not throttled
      if (isTranscribing) {
        const now = Date.now();
        restartTimestamps = restartTimestamps.filter(ts => now - ts < 60000); // last 60s
        if (restartTimestamps.length < MAX_RESTARTS_PER_MINUTE) {
          restartTimestamps.push(now);
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              setRecognitionError('Failed to restart speech recognition.');
            }
          }, 500);
        } else {
          setRecognitionError('Speech recognition auto-restart limit reached. Please wait a minute.');
        }
      }
    };
    // @ts-ignore
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimTranscript(interim);
      if (finalTranscript) {
        const newEntry: TranscriptEntry = {
          id: Date.now().toString(),
          speaker: localParticipant?.user_name || 'You',
          text: finalTranscript.trim(),
          timestamp: new Date(),
          sessionId: localParticipant?.session_id || 'unknown'
        };
        setTranscript(prev => [...prev, newEntry]);
      }
    };
    // @ts-ignore
    recognition.onerror = (event: any) => {
      setRecognitionError(event.error || 'Speech recognition error');
      if (event.error === 'not-allowed') {
        setIsTranscribing(false);
        alert('Microphone access is required for transcription. Please enable microphone access and try again.');
        return;
      }
      if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'aborted') {
        // Try to auto-restart after a short delay if not throttled
        if (isTranscribing) {
          const now = Date.now();
          restartTimestamps = restartTimestamps.filter(ts => now - ts < 60000);
          if (restartTimestamps.length < MAX_RESTARTS_PER_MINUTE) {
            restartTimestamps.push(now);
            setTimeout(() => {
              try {
                recognition.start();
              } catch (e) {}
            }, 1000);
          } else {
            setRecognitionError('Speech recognition auto-restart limit reached. Please wait a minute.');
          }
        }
      } else {
        setIsTranscribing(false);
      }
    };
    recognitionRef.current = recognition;
  }, [localParticipant?.user_name, localParticipant?.session_id, isTranscribing, transcriptionLang]);

  const toggleTranscription = useCallback(() => {
    if (!isRecognitionSupported) {
      setRecognitionError('Speech recognition is not supported in this browser.');
      return;
    }
    if (!recognitionRef.current) {
      initializeTranscription();
    }
    if (isTranscribing) {
      if (recognitionRef.current && isRecognitionRunning.current) {
        recognitionRef.current.stop();
      }
      setIsTranscribing(false);
      setInterimTranscript('');
    } else {
      try {
        if (recognitionRef.current && !isRecognitionRunning.current) {
          recognitionRef.current.lang = transcriptionLang;
          recognitionRef.current.start();
          setIsTranscribing(true);
          setRecognitionError(null);
        }
      } catch (error: any) {
        setRecognitionError('Failed to start transcription: ' + (error?.message || 'Unknown error'));
      }
    }
  }, [isTranscribing, initializeTranscription, isRecognitionSupported, transcriptionLang]);

  const saveTranscript = useCallback(async () => {
    if (transcript.length === 0) {
      alert('No transcript to save');
      return;
    }

    try {
      const content = transcript
        .map(entry => `[${entry.timestamp.toLocaleTimeString()}] ${entry.speaker}: ${entry.text}`)
        .join('\n');

      const participants = Array.from(new Set(transcript.map(entry => entry.speaker)));

      const response = await fetch('/api/transcripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId: meetingId || 'unknown',
          userId: localParticipant?.session_id || 'unknown',
          userName: localParticipant?.user_name || 'Anonymous',
          content,
          participants
        }),
      });

      if (response.ok) {
        alert('Transcript saved successfully!');
      } else {
        alert('Failed to save transcript');
      }
    } catch (error) {
      console.error('Error saving transcript:', error);
      alert('Failed to save transcript');
    }
  }, [transcript, meetingId, localParticipant]);

  const downloadTranscript = useCallback(() => {
    if (transcript.length === 0) {
      alert('No transcript to download');
      return;
    }

    // Create RTF content
    const rtfHeader = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}';
    const rtfTitle = '\\f0\\fs24\\b Meeting Transcript\\b0\\fs20\\par\\par';
    
    const rtfContent = transcript
      .map(entry => {
        const timeStr = entry.timestamp.toLocaleTimeString();
        return `\\b ${entry.speaker}\\b0 (${timeStr}): ${entry.text}\\par`;
      })
      .join('');

    const rtfDocument = `${rtfHeader}${rtfTitle}${rtfContent}}`;

    const blob = new Blob([rtfDocument], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-transcript-${new Date().toISOString().split('T')[0]}.rtf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [transcript]);

  const leaveMeeting = useCallback(async () => {
    // Stop transcription and save transcript before leaving
    if (recognitionRef.current && isTranscribing) {
      recognitionRef.current.stop();
      setIsTranscribing(false);
    }

    // Save transcript if there's content
    if (transcript.length > 0) {
      await saveTranscript();
    }

    // Leave the Daily meeting
    if (daily) {
      await daily.leave();
    }

    // Call the onLeave callback
    if (onLeave) {
      onLeave();
    }
  }, [daily, isTranscribing, transcript, saveTranscript, onLeave]);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  // Initialize transcription when component mounts if supported
  useEffect(() => {
    if (meetingState === 'joined-meeting') {
      initializeTranscription();
      // Auto-start transcription when meeting starts
      setTimeout(() => {
        if (!isTranscribing && isRecognitionSupported) {
          toggleTranscription();
        }
      }, 2000);
    }
    return () => {
      if (recognitionRef.current && isRecognitionRunning.current) {
        recognitionRef.current.stop();
        isRecognitionRunning.current = false;
      }
    };
  }, [meetingState, initializeTranscription, toggleTranscription, isTranscribing, isRecognitionSupported]);

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
            variant={showTranscript ? "default" : "outline"}
            size="sm"
            onClick={() => setShowTranscript(!showTranscript)}
          >
            <FileText className="w-4 h-4 mr-1" />
            Transcript
          </Button>
          
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

      {/* Main content with video and transcript */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div 
          ref={videoContainerRef}
          className={`${showTranscript ? 'flex-1' : 'w-full'} p-4 overflow-hidden`}
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

        {/* Transcript Sidebar */}
        {showTranscript && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Live Transcript</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTranscript(false)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2 mb-3">
                <Button
                  variant={isTranscribing ? "destructive" : "default"}
                  size="sm"
                  onClick={toggleTranscription}
                  disabled={!isRecognitionSupported}
                >
                  {isTranscribing ? 'Stop' : 'Start'} Transcription
                </Button>
                {isTranscribing && (
                  <div className="flex items-center text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                    Recording
                  </div>
                )}
                {!isRecognitionSupported && (
                  <div className="text-xs text-red-500 ml-2">Speech recognition not supported in this browser.</div>
                )}
                {recognitionError && (
                  <div className="text-xs text-red-500 ml-2">{recognitionError}</div>
                )}
              </div>
              <div className="flex space-x-2 mb-2 items-center">
                <label htmlFor="transcription-lang" className="text-xs text-gray-600">Language:</label>
                <select
                  id="transcription-lang"
                  className="border rounded px-2 py-1 text-xs"
                  value={transcriptionLang}
                  onChange={e => setTranscriptionLang(e.target.value)}
                  disabled={isTranscribing}
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="hi-IN">Hindi (India)</option>
                  <option value="es-ES">Spanish (Spain)</option>
                  <option value="fr-FR">French (France)</option>
                  <option value="de-DE">German</option>
                  <option value="zh-CN">Chinese (Mandarin)</option>
                  {/* Add more as needed */}
                </select>
              </div>
              <div className="text-xs text-gray-500 mb-2">Only your speech is transcribed (from your microphone).</div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveTranscript}
                  disabled={transcript.length === 0}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTranscript}
                  disabled={transcript.length === 0}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download RTF
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {transcript.length === 0 && !interimTranscript ? (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No transcript yet</p>
                  <p className="text-sm">Start transcription to see live captions</p>
                </div>
              ) : (
                <>
                  {transcript.map((entry) => (
                    <div key={entry.id} className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {entry.speaker}
                        </span>
                        <span className="text-xs text-gray-500">
                          {entry.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{entry.text}</p>
                    </div>
                  ))}
                  {interimTranscript && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg animate-pulse">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-blue-900">You (live)</span>
                        <span className="text-xs text-blue-500">...</span>
                      </div>
                      <p className="text-sm text-blue-700">{interimTranscript}</p>
                    </div>
                  )}
                </>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}
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
            variant="destructive"
            size="lg"
            onClick={leaveMeeting}
            className="w-12 h-12 rounded-full p-0"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>
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
        otherUserName={otherUserName}
        meetingDescription={meetingDescription}
      />
    </DailyProvider>
  );
}
