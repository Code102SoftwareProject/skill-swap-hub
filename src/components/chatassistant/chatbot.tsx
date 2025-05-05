'use client'

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Mic, StopCircle } from 'lucide-react';
import { sendMessage } from '@/lib/services/chatbotservice';
import { useAuth } from '@/lib/context/AuthContext';

// Define SpeechRecognition interfaces
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
      length: number;
    };
    length: number;
  };
}

interface SpeechRecognition extends EventTarget {
  onend: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface MessageContent {
  text: string;
  type?: string;
}

interface Message {
  type: 'user' | 'bot';
  content: string | MessageContent;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      type: 'bot', 
      content: 'Hi! I\'m your assistant. I can help you with verification status checks and answer technical questions. You can also send voice messages!' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const hasStartedRecording = useRef<boolean>(false);
  
  const { user } = useAuth();

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Debug effect to log state changes
  useEffect(() => {
    console.log('Chatbot isOpen state:', isOpen);
  }, [isOpen]);

  // Cleanup recording when component unmounts
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      stopRecording();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const stopRecording = () => {
    setIsRecording(false);
    
    // First, store the current transcription to a variable
    const finalTranscriptText = transcribedText.trim();
    
    // Add a small delay to allow final transcript to process
    setTimeout(() => {
      // Stop speech recognition first
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      
      // Then stop media recorder after a short delay
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        
        // Stop all tracks on the stream
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        
        // Clear recording timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
        
        // Send message if we have a transcription
        if (hasStartedRecording.current && (finalTranscriptText || transcribedText.trim())) {
          const messageText = finalTranscriptText || transcribedText.trim();
          
          // Add the transcribed text as a normal user message
          setMessages(prev => [
            ...prev, 
            { 
              type: 'user', 
              content: messageText
            }
          ]);
          
          // Process the transcribed text as a message
          processTextMessage(messageText);
        }
        
        // Reset recording states
        setRecordingTime(0);
        setIsTranscribing(false);
        setTranscribedText('');
        hasStartedRecording.current = false;
      }
    }, 500); // 500ms delay to ensure final transcript is processed
  };
  
  // Update startRecording function to improve the speech recognition handling
  
  const startRecording = async () => {
    try {
      // Reset transcribed text from previous recordings
      setTranscribedText('');
      setIsTranscribing(true);
      hasStartedRecording.current = false;
      
      // Get the stream for audio recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
  
      // This event is triggered when actual data is available
      mediaRecorder.ondataavailable = () => {
        // This ensures we've actually started recording and aren't just clicking the button
        hasStartedRecording.current = true;
      };
  
      // Since we now handle message submission in stopRecording(),
      // mediaRecorder.onstop only needs to handle cleanup if needed
      mediaRecorder.onstop = () => {
        // Any final cleanup if needed
        // Most logic has been moved to stopRecording()
      };
  
      // Initialize Web Speech API for speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US'; // You can make this configurable
        
        recognition.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              // Also capture interim results to show real-time transcription
              finalTranscript += transcript + ' ';
            }
          }
          
          if (finalTranscript) {
            setTranscribedText(finalTranscript.trim());
          }
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error', event.error);
        };
        
        // Add an onend handler to ensure we capture final results
        recognition.onend = () => {
          console.log("Speech recognition ended");
        };
        
        recognition.start();
      } else {
        console.error("Speech recognition not supported in this browser");
        alert("Speech recognition is not supported in your browser. Please try Chrome or Edge.");
      }
  
      // Start recording
      mediaRecorder.start(100); 
      setIsRecording(true);
      
      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Error accessing microphone. Please check your permissions.");
      setIsTranscribing(false);
    }
  };
  const processTextMessage = async (text: string) => {
    setIsLoading(true);
    try {
      const botResponse = await sendMessage(text, user?._id);
      
      if (typeof botResponse === 'string') {
        setMessages(prev => [...prev, { type: 'bot', content: botResponse }]);
      } else {
        setMessages(prev => [...prev, { type: 'bot', content: botResponse }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [
        ...prev, 
        { 
          type: 'bot', 
          content: 'Sorry, I encountered an error. Please try again later.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    
    processTextMessage(userMessage);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render message content based on type
  const renderMessageContent = (message: Message) => {
    if (typeof message.content === 'string') {
      return <div className="whitespace-pre-wrap">{message.content}</div>;
    }

    // For structured content
    return (
      <div className="space-y-3">
        <div className="whitespace-pre-wrap">{message.content.text}</div>
        
        {/* You can add special formatting for different message types here */}
        {message.content.type === 'verification_status' && (
          <div className="mt-2 text-xs text-blue-600">
            Verification status information
          </div>
        )}
      </div>
    );
  };

  const toggleChat = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Toggle chat clicked, current state:', isOpen);
    setIsOpen(prevState => !prevState);
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 bg-blue-700 text-white p-4 rounded-full shadow-lg hover:bg-blue-900 transition-colors z-50"
        aria-label="AI Assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">AI Assistant</h3>
        </div>
        <button
          onClick={toggleChat}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close chat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-96">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {renderMessageContent(message)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        {isRecording && isTranscribing && transcribedText && (
          <div className="flex justify-end">
            <div className="bg-gray-200 text-gray-800 p-3 rounded-lg">
              <div className="italic text-xs mb-1">Currently transcribing:</div>
              <div>{transcribedText}</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2 items-center">
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <StopCircle className="h-5 w-5" />
              <span className="ml-1 text-xs">{formatTime(recordingTime)}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-900 transition-colors"
              aria-label="Record voice message"
            >
              <Mic className="h-5 w-5" />
            </button>
          )}
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 text-black p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent"
            disabled={isRecording}
          />
          
          <button
            type="submit"
            disabled={isLoading || isRecording || !input.trim()}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}