import React, { useState, useEffect, useRef } from 'react';
import './ChatPage.css';

const ChatPage = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const API_BASE = 'http://localhost:8081/api';
  const token = localStorage.getItem("authToken");
  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const wsRef = useRef(null);


  // Kết nối WebSocket
  useEffect(() => {
    if (token) {
      const ws = new WebSocket(`ws://localhost:8081?token=${token}`);
      
      ws.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        
        if (data.type === 'NEW_MESSAGE') {
          // Thêm tin nhắn mới vào danh sách
          setMessages(prev => [...prev, data.message]);
        }
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
      };
      
      wsRef.current = ws;
      
      return () => {
        ws.close();
      };
    }
  }, [token]);

  useEffect(() => {    
    if (token && currentUser._id) {
      console.log('Calling fetchChatList...');
      fetchChatList();
    } else {
      console.log('Missing token or user ID, not fetching chats');
    }
  }, [token, currentUser._id]);

  // Lấy danh sách chat từ API
  const fetchChatList = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/chat/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      } else {
        console.error('Lỗi khi lấy danh sách chat:', response.status);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách chat:', error);
    } finally {
      setLoading(false);
    }
  };

  console.log(chats);
  // Lấy tin nhắn của chat
  const fetchMessages = async (chatId) => {
    try {
      const response = await fetch(`${API_BASE}/chat/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Lỗi khi lấy tin nhắn:', error);
    }
  };

  // Gửi tin nhắn
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const response = await fetch(`${API_BASE}/chat/${selectedChat._id}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          content: newMessage,
          type: 'text'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const selectChat = (chat) => {
    setSelectedChat(chat);
    fetchMessages(chat._id);
    
    // Join chat room qua WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'JOIN_CHAT',
        chatId: chat._id
      }));
    }
    
    console.log('Selected chat:', chat)
  };

  const getOtherMember = (chat) => {
    if (!chat || !chat.members || !Array.isArray(chat.members)) {
      console.log('Invalid chat or members:', chat);
      return null;
    }
    if (!currentUser || !currentUser._id) {
      console.log('Invalid currentUser:', currentUser);
      return null;
    }
    return chat.members.find(p => p && p._id !== currentUser._id);
  };

  return (
    <div className="chat-container">
      {/* Sidebar - Danh sách chat */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>Tin nhắn</h3>
        </div>
        
        <div className="chat-list">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : chats.length === 0 ? (
            <div className="no-chats">Chưa có cuộc trò chuyện nào</div>
          ) : (
            chats.map(chat => {
            const otherUser = getOtherMember(chat);
            console.log(chat);
            console.log(otherUser);
            return (
            <div 
                key={chat._id} 
                className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
                onClick={() => selectChat(chat)}
            >
                <div className="chat-item-avatar">
                {otherUser ? (otherUser.first_name?.[0] || '?').toUpperCase() : '?'}
                </div>
                <div className="chat-item-info">
                <div className="chat-item-name">
                    {otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : 'Unknown User'}
                </div>
                <div className="chat-item-last-message">
                    {chat.last_message.content || 'Chưa có tin nhắn'}
                </div>
                </div>
            </div>
            );
        })
        )}
    </div>
    </div>

      {/* Main chat area */}
      <div className="chat-main">
        {selectedChat ? (
          <>
            {/* Chat header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-header-avatar">
                  {getOtherMember(selectedChat) ? 
                    (getOtherMember(selectedChat).first_name?.[0] || '?').toUpperCase() : '?'}
                </div>
                <div className="chat-header-name">
                  {getOtherMember(selectedChat) ? 
                    `${getOtherMember(selectedChat).first_name} ${getOtherMember(selectedChat).last_name}` : 
                    'Unknown User'}
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="no-messages">
                  Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                </div>
              ) : (
                messages.map((message, index) => {
                  // So sánh ID với cả dạng object và string
                  const messageSenderId = message.sender_id?._id || message.sender_id;
                  const isMyMessage = messageSenderId === currentUser._id || 
                                    messageSenderId?.toString() === currentUser._id?.toString();
                  const otherUser = getOtherMember(selectedChat);
                  
                  // Debug log
                  console.log('Message:', {
                    content: message.content,
                    messageSenderId,
                    currentUserId: currentUser._id,
                    isMyMessage
                  });
                  
                  return (
                    <div 
                      key={index}
                      className={`message-wrapper ${isMyMessage ? 'sent' : 'received'}`}
                    >
                      {/* Avatar bên trái cho tin nhắn người khác */}
                      {!isMyMessage && (
                        <div className="message-avatar">
                          {otherUser ? 
                            (otherUser.first_name?.[0] || '?').toUpperCase() : '?'}
                        </div>
                      )}
                      
                      <div className="message-content-wrapper">
                        <div className="message-content">
                          {message.content}
                        </div>
                        <div className="message-time">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      
                      {/* Avatar bên phải cho tin nhắn của mình */}
                      {isMyMessage && (
                        <div className="message-avatar">
                          {currentUser.first_name?.[0]?.toUpperCase() || 'M'}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Message input */}
            <div className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                className="message-input"
              />
              <button onClick={sendMessage} className="send-button">
                Gửi
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-message">
              <h3>Chọn một cuộc trò chuyện</h3>
              <p>Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;