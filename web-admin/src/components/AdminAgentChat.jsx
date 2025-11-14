import React, { useEffect, useRef, useState } from 'react';

// You'll need to import your API function
import { postChatMessage } from "../services/api";

export default function AdminAgentChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Set initial welcome message without marking it as unread
    setMessages([
      {
        id: 'msg-001',
        sender: 'agent',
        content: 'Hi Flora Admin! I can help triage alerts or summarize reports. Ask me about the current sensor status.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    // Don't set unread count here - welcome message shouldn't trigger notification
  }, []);

  const handleSend = async (preset) => {
    const text = (preset ?? input).trim();
    if (!text || isTyping) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage = {
      id: `msg-${Date.now()}`,
      sender: 'admin',
      content: text,
      timestamp,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const { reply } = await postChatMessage(text);
      
      const agentMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        content: reply || "Sorry, I couldn't process that.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, agentMessage]);
      
      // Only increment unread count if chat is closed AND it's not the initial welcome message
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        content: `Error: ${error.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
      
      // Only increment unread count for error messages if chat is closed
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOpenChat = () => {
    setIsOpen(true);
    setUnreadCount(0); // Reset unread count when chat is opened
  };

  const handleCloseChat = () => {
    setIsOpen(false);
  };

  // SVG Icons as React components
  const ChatIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );

  const SparkleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );

  const PersonIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="7" r="4"/>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    </svg>
  );

  const SendIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22,2 15,22 11,13 2,9"/>
    </svg>
  );

  const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );

  // Inline styles object
  const styles = {
    widget: {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
    },
    toggleButton: {
      position: 'relative',
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: '#2563EB',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleButtonHover: {
      transform: 'scale(1.1)',
      boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4)',
    },
    badge: {
      position: 'absolute',
      top: '-5px',
      right: '-5px',
      background: '#EF4444',
      color: 'white',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
    },
    window: {
      width: '380px',
      height: '600px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    header: {
      background: 'white',
      padding: '16px',
      borderBottom: '1px solid #E2E8F0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerContent: {
      flex: 1,
    },
    agentInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px',
    },
    agentTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#0F172A',
    },
    agentSubtitle: {
      fontSize: '12px',
      color: '#64748B',
      marginTop: '2px',
    },
    statusIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      background: '#E0F2FE',
      borderRadius: '999px',
      alignSelf: 'flex-start',
    },
    statusDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#16A34A',
    },
    statusText: {
      fontSize: '11px',
      fontWeight: '600',
      color: '#1E40AF',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: '#64748B',
      cursor: 'pointer',
      padding: '4px',
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
    },
    closeButtonHover: {
      background: '#F1F5F9',
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      background: '#F8FAFC',
    },
    messagesList: {
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    messageRow: {
      display: 'flex',
      gap: '8px',
      maxWidth: '100%',
    },
    agentMessage: {
      justifyContent: 'flex-start',
    },
    adminMessage: {
      justifyContent: 'flex-end',
    },
    avatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    agentAvatar: {
      background: '#2563EB',
      color: 'white',
    },
    adminAvatar: {
      background: 'white',
      border: '2px solid #BFDBFE',
      color: '#2563EB',
    },
    messageBubble: {
      maxWidth: '75%',
      padding: '10px 14px',
      borderRadius: '16px',
      wordWrap: 'break-word',
    },
    agentBubble: {
      background: '#E0EAFF',
      borderBottomLeftRadius: '4px',
    },
    adminBubble: {
      background: '#2563EB',
      borderBottomRightRadius: '4px',
    },
    typingBubble: {
      padding: '12px 16px',
    },
    messageContent: {
      fontSize: '14px',
      lineHeight: 1.4,
    },
    agentMessageContent: {
      color: '#0F172A',
    },
    adminMessageContent: {
      color: 'white',
    },
    messageTimestamp: {
      fontSize: '11px',
      marginTop: '6px',
      opacity: 0.7,
    },
    agentTimestamp: {
      color: '#64748B',
      textAlign: 'left',
    },
    adminTimestamp: {
      color: '#BFDBFE',
      textAlign: 'right',
    },
    typingDots: {
      display: 'flex',
      gap: '4px',
      alignItems: 'center',
    },
    typingDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#1D4ED8',
      animation: 'typingAnimation 1.4s infinite ease-in-out',
    },
    inputArea: {
      padding: '16px',
      background: 'white',
      borderTop: '1px solid #E2E8F0',
    },
    inputContainer: {
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-end',
    },
    messageInput: {
      flex: 1,
      padding: '12px 14px',
      border: '1px solid #E2E8F0',
      borderRadius: '14px',
      background: '#F8FAFC',
      fontSize: '14px',
      color: '#0F172A',
      resize: 'none',
      maxHeight: '120px',
      minHeight: '44px',
      fontFamily: 'inherit',
    },
    messageInputFocus: {
      outline: 'none',
      borderColor: '#2563EB',
      background: 'white',
    },
    sendButton: {
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      background: '#2563EB',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'background 0.2s ease',
    },
    sendButtonHover: {
      background: '#1D4ED8',
    },
    sendButtonDisabled: {
      background: '#94A3B8',
      cursor: 'not-allowed',
    },
  };

  const [isHovered, setIsHovered] = useState(false);
  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const [isSendHovered, setIsSendHovered] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  return (
    <>
      <style>
        {`
          @keyframes typingAnimation {
            0%, 80%, 100% {
              transform: scale(0.8);
              opacity: 0.5;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
          .sp-chat-messages-container::-webkit-scrollbar {
            width: 6px;
          }
          .sp-chat-messages-container::-webkit-scrollbar-track {
            background: #F1F5F9;
          }
          .sp-chat-messages-container::-webkit-scrollbar-thumb {
            background: #CBD5E1;
            border-radius: 3px;
          }
          .sp-chat-messages-container::-webkit-scrollbar-thumb:hover {
            background: #94A3B8;
          }
          .sp-chat-typing-dot:nth-child(1) { animation-delay: -0.32s; }
          .sp-chat-typing-dot:nth-child(2) { animation-delay: -0.16s; }
        `}
      </style>
      
      <div style={styles.widget}>
        {!isOpen && (
          <button 
            style={{
              ...styles.toggleButton,
              ...(isHovered && styles.toggleButtonHover)
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleOpenChat}
          >
            <ChatIcon />
            {/* Only show badge when there are unread messages */}
            {unreadCount > 0 && (
              <span style={styles.badge}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}

        {isOpen && (
          <div style={styles.window}>
            <div style={styles.header}>
              <div style={styles.headerContent}>
                <div style={styles.agentInfo}>
                  <SparkleIcon />
                  <div>
                    <div style={styles.agentTitle}>SmartPlant Agent</div>
                    <div style={styles.agentSubtitle}>Enterprise AI assistant for conservation teams</div>
                  </div>
                </div>
                <div style={styles.statusIndicator}>
                  <span style={styles.statusDot}></span>
                  <span style={styles.statusText}>Online</span>
                </div>
              </div>
              <button 
                style={{
                  ...styles.closeButton,
                  ...(isCloseHovered && styles.closeButtonHover)
                }}
                onMouseEnter={() => setIsCloseHovered(true)}
                onMouseLeave={() => setIsCloseHovered(false)}
                onClick={handleCloseChat}
              >
                <CloseIcon />
              </button>
            </div>

            <div 
              className="sp-chat-messages-container"
              style={styles.messagesContainer}
            >
              <div style={styles.messagesList}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      ...styles.messageRow,
                      ...(message.sender === 'agent' ? styles.agentMessage : styles.adminMessage)
                    }}
                  >
                    {message.sender === 'agent' && (
                      <div style={{...styles.avatar, ...styles.agentAvatar}}>
                        <SparkleIcon />
                      </div>
                    )}
                    <div style={{
                      ...styles.messageBubble,
                      ...(message.sender === 'agent' ? styles.agentBubble : styles.adminBubble)
                    }}>
                      <div style={{
                        ...styles.messageContent,
                        ...(message.sender === 'agent' ? styles.agentMessageContent : styles.adminMessageContent)
                      }}>
                        {message.content}
                      </div>
                      <div style={{
                        ...styles.messageTimestamp,
                        ...(message.sender === 'agent' ? styles.agentTimestamp : styles.adminTimestamp)
                      }}>
                        {message.timestamp}
                      </div>
                    </div>
                    {message.sender === 'admin' && (
                      <div style={{...styles.avatar, ...styles.adminAvatar}}>
                        <PersonIcon />
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div style={{...styles.messageRow, ...styles.agentMessage}}>
                    <div style={{...styles.avatar, ...styles.agentAvatar}}>
                      <SparkleIcon />
                    </div>
                    <div style={{...styles.messageBubble, ...styles.agentBubble, ...styles.typingBubble}}>
                      <div style={styles.typingDots}>
                        <span 
                          className="sp-chat-typing-dot"
                          style={styles.typingDot}
                        ></span>
                        <span 
                          className="sp-chat-typing-dot"
                          style={styles.typingDot}
                        ></span>
                        <span 
                          className="sp-chat-typing-dot"
                          style={styles.typingDot}
                        ></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div style={styles.inputArea}>
              <div style={styles.inputContainer}>
                <textarea
                  ref={inputRef}
                  style={{
                    ...styles.messageInput,
                    ...(isInputFocused && styles.messageInputFocus)
                  }}
                  placeholder="Ask the agent..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  rows={1}
                />
                <button
                  style={{
                    ...styles.sendButton,
                    ...(isSendHovered && styles.sendButtonHover),
                    ...((!input.trim() || isTyping) && styles.sendButtonDisabled)
                  }}
                  onMouseEnter={() => setIsSendHovered(true)}
                  onMouseLeave={() => setIsSendHovered(false)}
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}