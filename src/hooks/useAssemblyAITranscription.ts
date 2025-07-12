import { useState, useRef, useCallback, useEffect } from 'react';

interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  sessionId: string;
  confidence?: number;
  turnOrder?: number;
}

interface UseAssemblyAITranscriptionProps {
  meetingId?: string;
  userName?: string;
  sessionId?: string;
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void;
}

interface UseAssemblyAITranscriptionReturn {
  transcript: TranscriptEntry[];
  isTranscribing: boolean;
  isSupported: boolean;
  error: string | null;
  interimText: string;
  startTranscription: () => Promise<void>;
  stopTranscription: () => void;
  saveTranscript: () => Promise<boolean>;
  downloadTranscript: () => void;
}

export const useAssemblyAITranscription = ({
  meetingId,
  userName,
  sessionId,
  onTranscriptUpdate
}: UseAssemblyAITranscriptionProps): UseAssemblyAITranscriptionReturn => {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState<string>('');

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tokenRef = useRef<string | null>(null);
  const currentTurnOrder = useRef<number>(0);
  const runningTranscript = useRef<string>('');

  // Check if browser supports required APIs
  useEffect(() => {
    const supported = !!(navigator.mediaDevices && 
      typeof navigator.mediaDevices.getUserMedia === 'function' && 
      window.MediaRecorder);
    setIsSupported(supported);
    
    if (!supported) {
      setError('Browser does not support required audio APIs');
    }
  }, []);

  // Get AssemblyAI token
  const getToken = useCallback(async (): Promise<{ token: string; apiHost: string }> => {
    try {
      const response = await fetch('/api/transcription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          meetingId,
          userId: sessionId
        }),
      });

      const data = await response.json();
      if (data.success) {
        return { token: data.token, apiHost: data.apiHost };
      } else {
        throw new Error(data.message || 'Failed to get transcription token');
      }
    } catch (error) {
      console.error('Error getting AssemblyAI token:', error);
      throw error;
    }
  }, [meetingId, sessionId]);

  // Convert audio blob to PCM16 format
  const convertToPCM16 = async (audioBlob: Blob): Promise<ArrayBuffer> => {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Convert to mono 16kHz PCM16
    const samples = audioBuffer.getChannelData(0);
    const pcm16 = new Int16Array(samples.length);
    
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    
    return pcm16.buffer;
  };

  // Start transcription
  const startTranscription = useCallback(async () => {
    if (!isSupported) {
      setError('Transcription not supported in this browser');
      return;
    }

    if (isTranscribing) {
      return;
    }

    try {
      setError(null);
      setIsTranscribing(true);

      // Get token from API
      const { token, apiHost } = await getToken();
      tokenRef.current = token;

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      streamRef.current = stream;

      // Create WebSocket connection to AssemblyAI Universal Streaming API
      const wsUrl = `wss://${apiHost}/v3/stream?token=${token}`;
      const socket = new WebSocket(wsUrl);
      
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('AssemblyAI Universal Streaming connected');
        
        // Send connection parameters
        socket.send(JSON.stringify({
          sample_rate: 16000,
          encoding: 'pcm_s16le',
          format_turns: true,
          end_of_turn_confidence_threshold: 0.7,
          min_end_of_turn_silence_when_confident: 200,
          max_turn_silence: 2000
        }));

        // Create MediaRecorder to capture audio
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=pcm'
        });
        
        mediaRecorderRef.current = mediaRecorder;

        let audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
            
            // Process audio chunk every 50ms for optimal latency
            if (audioChunks.length >= 1) {
              try {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const pcm16Buffer = await convertToPCM16(audioBlob);
                
                if (socket.readyState === WebSocket.OPEN) {
                  // Send binary PCM data
                  socket.send(pcm16Buffer);
                }
                
                audioChunks = []; // Clear processed chunks
              } catch (conversionError) {
                console.warn('Audio conversion error:', conversionError);
              }
            }
          }
        };

        // Start recording in small chunks for low latency
        mediaRecorder.start(50); // 50ms chunks
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.message_type === 'SessionBegins') {
            console.log('AssemblyAI session started:', data.session_id);
            currentTurnOrder.current = 0;
            runningTranscript.current = '';
          } 
          else if (data.message_type === 'Turn') {
            // Handle turn data from Universal Streaming
            const { 
              turn_order, 
              turn_is_formatted, 
              end_of_turn, 
              transcript: transcriptText,
              end_of_turn_confidence 
            } = data;
            
            if (transcriptText && transcriptText.trim()) {
              if (end_of_turn) {
                // Final turn complete
                const finalText = runningTranscript.current + ' ' + transcriptText.trim();
                
                const newEntry: TranscriptEntry = {
                  id: `${Date.now()}-${turn_order}`,
                  speaker: userName || 'You',
                  text: finalText.trim(),
                  timestamp: new Date(),
                  sessionId: sessionId || 'unknown',
                  confidence: end_of_turn_confidence,
                  turnOrder: turn_order
                };
                
                setTranscript(prev => {
                  const updated = [...prev, newEntry];
                  onTranscriptUpdate?.(updated);
                  return updated;
                });
                
                // Reset for next turn
                runningTranscript.current = '';
                setInterimText('');
              } else {
                // Interim result
                setInterimText(transcriptText);
              }
            }
          }
          else if (data.message_type === 'SessionTerminated') {
            console.log('AssemblyAI session terminated');
            setIsTranscribing(false);
          }
          else if (data.error) {
            console.error('AssemblyAI error:', data.error);
            setError(data.error);
          }
        } catch (parseError) {
          console.warn('Error parsing AssemblyAI message:', parseError);
        }
      };

      socket.onerror = (error) => {
        console.error('AssemblyAI WebSocket error:', error);
        setError('Connection error with transcription service');
      };

      socket.onclose = (event) => {
        console.log('AssemblyAI WebSocket closed:', event.code, event.reason);
        setIsTranscribing(false);
        setInterimText('');
      };

    } catch (error: any) {
      console.error('Error starting transcription:', error);
      setError(error.message || 'Failed to start transcription');
      setIsTranscribing(false);
    }
  }, [isSupported, isTranscribing, userName, sessionId, onTranscriptUpdate, getToken]);

  // Stop transcription
  const stopTranscription = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // Send termination message
      socketRef.current.send(JSON.stringify({ terminate_session: true }));
      socketRef.current.close();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsTranscribing(false);
    setInterimText('');
    runningTranscript.current = '';
  }, []);

  // Save transcript
  const saveTranscript = useCallback(async (): Promise<boolean> => {
    if (transcript.length === 0) {
      setError('No transcript to save');
      return false;
    }

    try {
      const content = transcript
        .map(entry => {
          const confidence = entry.confidence ? ` (${Math.round(entry.confidence * 100)}%)` : '';
          return `[${entry.timestamp.toLocaleTimeString()}] ${entry.speaker}${confidence}: ${entry.text}`;
        })
        .join('\n');

      const participants = Array.from(new Set(transcript.map(entry => entry.speaker)));

      const response = await fetch('/api/transcription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save',
          meetingId,
          content,
          participants,
          transcript
        }),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error saving transcript:', error);
      setError('Failed to save transcript');
      return false;
    }
  }, [transcript, meetingId]);

  // Download transcript
  const downloadTranscript = useCallback(() => {
    if (transcript.length === 0) {
      setError('No transcript to download');
      return;
    }

    const content = transcript
      .map(entry => {
        const timeStr = entry.timestamp.toLocaleTimeString();
        const confidence = entry.confidence ? ` (${Math.round(entry.confidence * 100)}%)` : '';
        return `[${timeStr}] ${entry.speaker}${confidence}: ${entry.text}`;
      })
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assemblyai-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTranscription();
    };
  }, [stopTranscription]);

  return {
    transcript,
    isTranscribing,
    isSupported,
    error,
    interimText,
    startTranscription,
    stopTranscription,
    saveTranscript,
    downloadTranscript
  };
};
