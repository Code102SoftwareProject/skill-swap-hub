'use client'

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Mic, StopCircle } from 'lucide-react';
import { sendMessage } from '@/services/chatbotservice';
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
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      type: 'bot', 
      content: 'Hi! I\'m your SkillSwap assistant. I can help you with platform features, skill verification, and technical questions. Try asking about forums, sessions, or programming concepts!' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const hasStartedRecording = useRef<boolean>(false);
  
  const { user } = useAuth();

  // Sample suggestion messages
  const suggestionMessages = [
    "How do I verify my skills?",
    "How to create a forum post?",
    "What is React useEffect?",
    "How to schedule a session?",
    "Check my verification status",
    "How to earn badges?",
    "What features does SkillSwap offer?",
    "How to join a meeting?"
  ];

  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if user is visiting for the first time and show welcome popup
  useEffect(() => {
    const hasSeenChatbotWelcome = localStorage.getItem('skillswap-chatbot-welcome-seen');
    if (!hasSeenChatbotWelcome) {
      const timer = setTimeout(() => {
        setShowWelcomePopup(true);
      }, 2000); // Show popup after 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    console.log('Chatbot isOpen state:', isOpen);
  }, [isOpen]);

  // Cleanup recording when component unmounts
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      // Stop recording safely without calling stopRecording to avoid dependency
      setIsRecording(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const stopRecording = () => {
    setIsRecording(false);
    
  
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
    
        hasStartedRecording.current = true;
      };
  

      mediaRecorder.onstop = () => {
        console.log('Recording stopped');
       
      };
  
      // Initialize Web Speech API for speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US'; 
        
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
    setShowSuggestions(false); // Hide suggestions after first message
    
    // Check message length
    if (text.length > 200) {
      setMessages(prev => [
        ...prev, 
        { 
          type: 'bot', 
          content: 'Please keep your message shorter (under 200 characters) for better assistance. Try breaking down your question into smaller parts.' 
        }
      ]);
      setIsLoading(false);
      return;
    }

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

  const handleSuggestionClick = (suggestion: string) => {
    setMessages(prev => [...prev, { type: 'user', content: suggestion }]);
    processTextMessage(suggestion);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    
    // Check message length before processing
    if (userMessage.length > 200) {
      setMessages(prev => [
        ...prev, 
        { type: 'user', content: userMessage },
        { 
          type: 'bot', 
          content: 'Please keep your message shorter (under 200 characters) for better assistance. Try breaking down your question into smaller parts.' 
        }
      ]);
      return;
    }

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

  const handleWelcomePopupClose = () => {
    setShowWelcomePopup(false);
    localStorage.setItem('skillswap-chatbot-welcome-seen', 'true');
  };

  const handleWelcomePopupTryNow = () => {
    setShowWelcomePopup(false);
    setIsOpen(true);
    localStorage.setItem('skillswap-chatbot-welcome-seen', 'true');
  };

  if (!isOpen) {
    return (
      <>
        {/* AI Assistant Welcome Popup for first-time users */}
        {showWelcomePopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs sm:max-w-sm w-full mx-4 relative overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleWelcomePopupClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
              >
                <X className="h-5 w-5" />
              </button>
              
              {/* AI Assistant Image and Bubble */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  {/* AI Assistant Orb */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-500 shadow-xl flex items-center justify-center animate-pulse">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-yellow-200 via-orange-300 to-pink-400 flex items-center justify-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white bg-opacity-30 flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Speech Bubble */}
                  <div className="absolute -top-2 -left-8 sm:-left-12 bg-yellow-200 px-3 py-1 sm:px-4 sm:py-2 rounded-full shadow-lg">
                    <span className="text-xs sm:text-sm font-medium text-gray-800">AI Assist</span>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-yellow-200"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="text-center space-y-4">
                <h3 className="font-bold text-lg sm:text-xl text-gray-800">Meet Your AI Assistant!</h3>
                
                <div className="space-y-3 text-sm sm:text-base text-gray-700">
                  <p>
                    🚀 <strong>Welcome to SkillSwap!</strong> I'm here to help you navigate the platform and answer your questions.
                  </p>
                  <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                    <p>• Ask about platform features</p>
                    <p>• Get help with skill verification</p>
                    <p>• Learn programming concepts</p>
                    <p>• Voice recognition supported!</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    onClick={handleWelcomePopupTryNow}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg"
                  >
                    Try Now
                  </button>
                  <button
                    onClick={handleWelcomePopupClose}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Chatbot Button */}
        <button
          onClick={toggleChat}
          className="fixed bottom-4 right-4 bg-blue-700 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-blue-900 transition-colors z-40"
          aria-label="AI Assistant"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </>
    );
  }

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0 sm:inset-auto sm:top-auto sm:bottom-4 sm:right-4 sm:left-auto sm:w-96 bg-white sm:rounded-lg shadow-xl flex flex-col z-40 sm:max-h-[600px] h-[calc(100vh-4rem)] sm:h-auto overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-white sm:rounded-t-lg flex-shrink-0 min-h-[60px]">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-base text-gray-800">AI Assistant</h3>
        </div>
        <button
          onClick={toggleChat}
          className="text-gray-500 hover:text-gray-700 p-1"
          aria-label="Close chat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto min-h-0 max-h-[calc(100vh-200px)] sm:max-h-none">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-lg text-sm ${
                message.type === 'user'
                  ? 'bg-blue-700 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              {renderMessageContent(message)}
            </div>
          </div>
        ))}
        
        {/* Sample suggestions - only show when no messages sent yet */}
        {showSuggestions && messages.length === 1 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 text-center">Try asking:</p>
            <div className="grid grid-cols-1 gap-2">
              {suggestionMessages.slice(0, 6).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs bg-blue-50 text-blue-700 p-3 rounded-lg hover:bg-blue-100 transition-colors text-left border border-blue-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 p-3 rounded-lg rounded-bl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        
        {/* Recording transcription preview */}
        {isRecording && isTranscribing && transcribedText && (
          <div className="flex justify-end">
            <div className="bg-gray-200 text-gray-800 p-3 rounded-lg rounded-br-none">
              <div className="italic text-xs mb-1">Currently transcribing:</div>
              <div className="text-sm">{transcribedText}</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t bg-white sm:rounded-b-lg flex-shrink-0 min-h-[80px]">
        {/* Character counter */}
        {input.length > 0 && (
          <div className="text-xs text-gray-500 mb-2 text-right">
            {input.length}/200 characters
            {input.length > 200 && (
              <span className="text-red-500 ml-2">Message too long!</span>
            )}
          </div>
        )}
        
        <div className="flex space-x-2 items-end">
          {/* Voice Recording Button */}
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors flex items-center flex-shrink-0"
            >
              <StopCircle className="h-5 w-5" />
              <span className="ml-1 text-xs hidden sm:inline">{formatTime(recordingTime)}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
              aria-label="Record voice message"
            >
              <Mic className="h-5 w-5" />
            </button>
          )}
          
          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about SkillSwap or tech topics..."
            className="flex-1 text-black p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm min-w-0"
            disabled={isRecording}
            maxLength={250}
          />
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || isRecording || !input.trim() || input.length > 200}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex-shrink-0"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}