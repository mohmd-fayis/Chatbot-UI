import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot } from 'lucide-react';
import './App.css';

type Message = {
  id: string;
  type: 'user' | 'bot';
  content: object | string;
  timestamp: Date;
};

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: { content: 'Hello! How can I help you today?' },
      timestamp: new Date()
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `${Date.now()}`,
      type: "user",
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: inputValue })
    });

    const data = await response.json();
    const botMessage: Message = {
      id: `${Date.now()}`,
      type: 'bot',
      content: data,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className='container'>

      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-content">
          <div className="chat-header-avatar">
            <Bot size={20} color="white" />
          </div>
          <div>
            <h1 className="chat-header-title">AI Assistant</h1>
            <p className="chat-header-subtitle">Online</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="chat-messages-container">
        <div className="chat-messages-wrapper">
          {messages.map(renderMessage)}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="typing-container">
              <div className="typing-wrapper">
                <div className="bot-avatar">
                  <Bot size={16} color="white" />
                </div>
                <div className="typing-bubble">
                  <div className="typing-dots">
                    <div className="typing-dot typing-dot-1"></div>
                    <div className="typing-dot typing-dot-2"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <div className="chat-input-container">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="chat-textarea"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="chat-send-button"
          >
            <Send size={16} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
};

const renderMessage = (message: Message) => {
  if (message.type === 'user' && typeof message.content === 'string') {
    return (
      <div key={message.id} className="user-message-container">
        <div className="user-message-wrapper">
          <div className="user-message-bubble">
            <p className="message-text">{message.content}</p>
          </div>
          <div className="user-avatar">
            <User size={16} color="white" />
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div key={message.id} className="bot-message-container">
        <div className="bot-message-wrapper">
          <div className="bot-avatar">
            <Bot size={16} color="white" />
          </div>
          <div className="bot-message-bubble">
            {typeof message.content === 'object' ? (
              <pre className="json-content">
                {JSON.stringify(message.content, null, 2)}
              </pre>
            ) : (
              <p className="message-text">{message.content}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
};

export default ChatInterface;