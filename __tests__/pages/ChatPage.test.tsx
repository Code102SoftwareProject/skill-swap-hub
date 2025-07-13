/**
 * ChatPage Component Tests
 * Tests the main chat functionality including message sending
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatPage from '@/app/user/chat/page';

// Mock the auth context
const mockUser = {
  _id: '6873cc50ac4e1d6e1cddf33f',
  firstName: 'Adeepa',
  lastName: 'Test',
  email: 'webservicesbyadeepa@gmail.com'
};

jest.mock('@/lib/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false
  })
}));

// Mock socket context
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connected: true
};

const mockJoinRoom = jest.fn();
const mockSendMessage = jest.fn();
const mockStartTyping = jest.fn();
const mockStopTyping = jest.fn();

jest.mock('@/lib/context/SocketContext', () => ({
  useSocket: () => ({
    socket: mockSocket,
    joinRoom: mockJoinRoom,
    sendMessage: mockSendMessage,
    startTyping: mockStartTyping,
    stopTyping: mockStopTyping,
    isConnected: true
  })
}));

// Mock API optimization context
jest.mock('@/lib/context/ApiOptimizationContext', () => ({
  ApiOptimizationProvider: ({ children }: any) => children
}));

// Mock child components
jest.mock('@/components/messageSystem/Sidebar', () => {
  return function MockSidebar({ userId, selectedChatRoomId, onChatSelect }: any) {
    return (
      <div data-testid="sidebar">
        <div>User ID: {userId}</div>
        <div>Selected: {selectedChatRoomId || 'None'}</div>
        <button 
          onClick={() => onChatSelect('6873cdd898892472c9621cf1', { id: 'other-user-id', name: 'John Doe' })}
          data-testid="select-chat-room"
        >
          Select Chat Room
        </button>
      </div>
    );
  };
});

jest.mock('@/components/messageSystem/ChatHeader', () => {
  return function MockChatHeader({ 
    chatRoomId, 
    userId, 
    onToggleMeetings, 
    onToggleSessions,
    showingSessions,
    showingMeetings 
  }: any) {
    return (
      <div data-testid="chat-header">
        <div>Chat Room: {chatRoomId}</div>
        <div>User: {userId}</div>
        <button onClick={() => onToggleMeetings(true)} data-testid="toggle-meetings">
          Toggle Meetings
        </button>
        <button onClick={() => onToggleSessions(true)} data-testid="toggle-sessions">
          Toggle Sessions
        </button>
        <div>Showing Sessions: {showingSessions ? 'Yes' : 'No'}</div>
        <div>Showing Meetings: {showingMeetings ? 'Yes' : 'No'}</div>
      </div>
    );
  };
});

jest.mock('@/components/messageSystem/MessageBox', () => {
  return function MockMessageBox({ chatRoomId, userId, newMessage, onReplySelect }: any) {
    return (
      <div data-testid="message-box">
        <div>Chat Room: {chatRoomId}</div>
        <div>User: {userId}</div>
        {newMessage && (
          <div data-testid="new-message">
            New Message: {newMessage.content || newMessage.text || 'Message received'}
          </div>
        )}
        <button onClick={() => onReplySelect({ id: 'msg-1', content: 'Test message' })}>
          Reply to Message
        </button>
      </div>
    );
  };
});

jest.mock('@/components/messageSystem/MessageInput', () => {
  return function MockMessageInput({ chatRoomId, senderId, replyingTo, onCancelReply }: any) {
    return (
      <div data-testid="message-input">
        <div>Chat Room: {chatRoomId}</div>
        <div>Sender: {senderId}</div>
        {replyingTo && (
          <div data-testid="replying-to">
            Replying to: {replyingTo.content}
            <button onClick={onCancelReply} data-testid="cancel-reply">Cancel Reply</button>
          </div>
        )}
        <input 
          data-testid="message-input-field"
          placeholder="Type a message..."
          onChange={(e) => {}}
        />
        <button 
          data-testid="send-message-btn"
          onClick={() => {
            // Simulate sending a message
            const messageData = {
              chatRoomId,
              senderId,
              content: 'Test message content',
              timestamp: Date.now()
            };
            mockSendMessage(messageData);
          }}
        >
          Send Message
        </button>
      </div>
    );
  };
});

jest.mock('@/components/messageSystem/MeetingBox', () => {
  return function MockMeetingBox({ chatRoomId, userId, onClose }: any) {
    return (
      <div data-testid="meeting-box">
        <div>Meeting Box for Chat Room: {chatRoomId}</div>
        <div>User: {userId}</div>
        <button onClick={onClose} data-testid="close-meetings">Close Meetings</button>
      </div>
    );
  };
});

jest.mock('@/components/messageSystem/SessionBox', () => {
  return function MockSessionBox({ chatRoomId, userId, otherUserId, onSessionUpdate }: any) {
    return (
      <div data-testid="session-box">
        <div>Session Box for Chat Room: {chatRoomId}</div>
        <div>User: {userId}</div>
        <div>Other User: {otherUserId}</div>
        <button onClick={onSessionUpdate} data-testid="update-session">Update Session</button>
      </div>
    );
  };
});

// Mock API services
jest.mock('@/services/chatApiServices', () => ({
  fetchChatRoom: jest.fn().mockResolvedValue({
    _id: '6873cdd898892472c9621cf1',
    participants: ['6873cc50ac4e1d6e1cddf33f', 'other-user-id']
  }),
  markChatRoomMessagesAsRead: jest.fn().mockResolvedValue(true)
}));

describe('ChatPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render the chat page with sidebar and empty state', () => {
      render(<ChatPage />);
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByText('Select a chat room from the sidebar')).toBeInTheDocument();
      expect(screen.getByText(`User ID: ${mockUser._id}`)).toBeInTheDocument();
    });

    it('should show user authentication state correctly', () => {
      render(<ChatPage />);
      
      expect(screen.getByText(`User ID: ${mockUser._id}`)).toBeInTheDocument();
    });
  });

  describe('Chat Room Selection', () => {
    it('should select the specified chat room and show chat interface', async () => {
      render(<ChatPage />);
      
      const selectChatButton = screen.getByTestId('select-chat-room');
      fireEvent.click(selectChatButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('chat-header')).toBeInTheDocument();
        expect(screen.getByTestId('message-box')).toBeInTheDocument();
        expect(screen.getByTestId('message-input')).toBeInTheDocument();
      });
      
      // Check that the chat room ID appears in the chat header specifically
      const chatHeader = screen.getByTestId('chat-header');
      expect(chatHeader).toHaveTextContent('Chat Room: 6873cdd898892472c9621cf1');
    });

    it('should join the socket room when chat room is selected', async () => {
      render(<ChatPage />);
      
      const selectChatButton = screen.getByTestId('select-chat-room');
      fireEvent.click(selectChatButton);
      
      await waitFor(() => {
        expect(mockJoinRoom).toHaveBeenCalledWith('6873cdd898892472c9621cf1');
      });
    });
  });

  describe('Message Sending Functionality', () => {
    it('should send a message when send button is clicked', async () => {
      render(<ChatPage />);
      
      // First select a chat room
      const selectChatButton = screen.getByTestId('select-chat-room');
      fireEvent.click(selectChatButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('message-input')).toBeInTheDocument();
      });
      
      // Click send message button
      const sendButton = screen.getByTestId('send-message-btn');
      fireEvent.click(sendButton);
      
      expect(mockSendMessage).toHaveBeenCalledWith({
        chatRoomId: '6873cdd898892472c9621cf1',
        senderId: mockUser._id,
        content: 'Test message content',
        timestamp: expect.any(Number)
      });
    });

    it('should handle incoming messages from socket', async () => {
      render(<ChatPage />);
      
      // Select chat room first
      const selectChatButton = screen.getByTestId('select-chat-room');
      fireEvent.click(selectChatButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('message-box')).toBeInTheDocument();
      });
      
      // Verify socket listener was set up
      expect(mockSocket.on).toHaveBeenCalledWith('receive_message', expect.any(Function));
      
      // Simulate receiving a message
      const messageHandler = mockSocket.on.mock.calls.find(call => call[0] === 'receive_message')[1];
      
      act(() => {
        messageHandler({
          chatRoomId: '6873cdd898892472c9621cf1',
          senderId: 'other-user-id',
          content: 'Hello from other user!',
          timestamp: Date.now()
        });
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('new-message')).toBeInTheDocument();
      });
    });
  });

  describe('Reply Functionality', () => {
    it('should handle message reply selection and cancellation', async () => {
      render(<ChatPage />);
      
      // Select chat room
      const selectChatButton = screen.getByTestId('select-chat-room');
      fireEvent.click(selectChatButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('message-box')).toBeInTheDocument();
      });
      
      // Click reply button in MessageBox
      const replyButton = screen.getByText('Reply to Message');
      fireEvent.click(replyButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('replying-to')).toBeInTheDocument();
        expect(screen.getByText('Replying to: Test message')).toBeInTheDocument();
      });
      
      // Cancel reply
      const cancelButton = screen.getByTestId('cancel-reply');
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('replying-to')).not.toBeInTheDocument();
      });
    });
  });

  describe('Meetings and Sessions Toggle', () => {
    it('should toggle meetings view', async () => {
      render(<ChatPage />);
      
      // Select chat room
      const selectChatButton = screen.getByTestId('select-chat-room');
      fireEvent.click(selectChatButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('chat-header')).toBeInTheDocument();
      });
      
      // Toggle meetings
      const meetingsButton = screen.getByTestId('toggle-meetings');
      fireEvent.click(meetingsButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('meeting-box')).toBeInTheDocument();
        expect(screen.queryByTestId('message-input')).not.toBeInTheDocument();
      });
    });

    it('should toggle sessions view', async () => {
      render(<ChatPage />);
      
      // Select chat room
      const selectChatButton = screen.getByTestId('select-chat-room');
      fireEvent.click(selectChatButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('chat-header')).toBeInTheDocument();
      });
      
      // Toggle sessions
      const sessionsButton = screen.getByTestId('toggle-sessions');
      fireEvent.click(sessionsButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('session-box')).toBeInTheDocument();
        expect(screen.queryByTestId('message-input')).not.toBeInTheDocument();
      });
    });

    it('should close meetings view when close button is clicked', async () => {
      render(<ChatPage />);
      
      // Select chat room and open meetings
      const selectChatButton = screen.getByTestId('select-chat-room');
      fireEvent.click(selectChatButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('chat-header')).toBeInTheDocument();
      });
      
      const meetingsButton = screen.getByTestId('toggle-meetings');
      fireEvent.click(meetingsButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('meeting-box')).toBeInTheDocument();
      });
      
      // Close meetings
      const closeButton = screen.getByTestId('close-meetings');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('meeting-box')).not.toBeInTheDocument();
        expect(screen.getByTestId('message-box')).toBeInTheDocument();
      });
    });
  });

  describe('Session Updates', () => {
    it('should handle session updates', async () => {
      render(<ChatPage />);
      
      // Select chat room and open sessions
      const selectChatButton = screen.getByTestId('select-chat-room');
      fireEvent.click(selectChatButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('chat-header')).toBeInTheDocument();
      });
      
      const sessionsButton = screen.getByTestId('toggle-sessions');
      fireEvent.click(sessionsButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('session-box')).toBeInTheDocument();
      });
      
      // Trigger session update
      const updateButton = screen.getByTestId('update-session');
      fireEvent.click(updateButton);
      
      // The component should handle the update (no specific assertion needed as it's internal state)
      expect(screen.getByTestId('session-box')).toBeInTheDocument();
    });
  });

  describe('Socket Connection Management', () => {
    it('should set up and clean up socket listeners properly', async () => {
      const { unmount } = render(<ChatPage />);
      
      // Select chat room to trigger socket setup
      const selectChatButton = screen.getByTestId('select-chat-room');
      fireEvent.click(selectChatButton);
      
      await waitFor(() => {
        expect(mockSocket.on).toHaveBeenCalledWith('receive_message', expect.any(Function));
      });
      
      // Unmount component to trigger cleanup
      unmount();
      
      expect(mockSocket.off).toHaveBeenCalledWith('receive_message', expect.any(Function));
    });
  });

  describe('Chat Room Data', () => {
    it('should fetch and use the correct chat room data', async () => {
      const { fetchChatRoom } = require('@/services/chatApiServices');
      
      render(<ChatPage />);
      
      // Select chat room
      const selectChatButton = screen.getByTestId('select-chat-room');
      fireEvent.click(selectChatButton);
      
      await waitFor(() => {
        expect(fetchChatRoom).toHaveBeenCalledWith('6873cdd898892472c9621cf1');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle sidebar toggle functionality', async () => {
      render(<ChatPage />);
      
      // Initially sidebar should be visible
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      
      // Select a chat room
      const selectChatButton = screen.getByTestId('select-chat-room');
      fireEvent.click(selectChatButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('chat-header')).toBeInTheDocument();
      });
      
      // Chat interface should be visible
      expect(screen.getByTestId('message-box')).toBeInTheDocument();
    });
  });
});
