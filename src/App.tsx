import React, { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Trash2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./App.css";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type Message = {
  id: string;
  role: "user" | "assistant";
  content: ResponseData | string;
  timestamp: Date;
};

type ResponseData = {
  response: {
    type: string;
    component: string;
    text: string;
    sql?: string;
    result?: any[];
  };
};

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
];

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(parsedMessages);
      } catch (error) {
        console.error("Failed to parse saved messages:", error);
        setMessages([
          {
            id: "1",
            role: "assistant",
            content: "Hello! How can I help you today?",
            timestamp: new Date(),
          },
        ]);
      }
    } else {
      fetchMessages();
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`);
      const data = await response.json();
      const initialMessages: Message[] = [
        {
          id: "1",
          role: "assistant",
          content: "Hello! How can I help you today?",
          timestamp: new Date(),
        },
        ...data.map((msg: any, index: number) => ({
          id: `fetched-${index}`,
          role: msg.role || "assistant",
          content: msg.content,
          timestamp: new Date(msg.timestamp || Date.now()),
        })),
      ];
      setMessages(initialMessages);
    } catch (error) {
      console.log("Failed to fetch messages: ", error);
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: "Hello! How can I help you today?",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: inputValue }),
      });

      const data = await response.json();
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.log("failed to get response: ", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "I am sorry, I could not process your request. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = async () => {
    setIsClearing(true);

    try {
      await fetch(`${API_BASE_URL}/clear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.log("Failed to clear backend: ", error);
    }

    localStorage.removeItem("chatMessages");

    const clearedMessage: Message = {
      id: `cleared-${Date.now()}`,
      role: "assistant",
      content: "Chat history has been cleared successfully.",
      timestamp: new Date(),
    };

    setMessages([clearedMessage]);
    setIsClearing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderTable = (data: any[]) => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);

    return (
      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column} className="table-header">
                    {column.replace(/_/g, " ").toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="table-row">
                  {columns.map((column) => (
                    <td key={column} className="table-cell">
                      {row[column]?.toString() || ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderList = (data: any[]) => {
    if (!data || data.length === 0) return null;

    const key = Object.keys(data[0])[0];

    return (
      <div className="list-container">
        <ul className="data-list">
          {data.map((item, index) => (
            <li key={index} className="list-item">
              {item[key]}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderBarChart = (data: any[]) => {
    if (!data || data.length === 0) return null;

    const keys = Object.keys(data[0]);
    const xKey = keys[0];
    const valueKey = keys[keys.length - 1];
    const categoryKey = keys.length > 2 ? keys[1] : null;

    let barData = data;
    let bars = [];

    if (categoryKey) {
      const categories = [...new Set(data.map((item) => item[categoryKey]))];
      const groupedData: Record<string, any> = {};

      data.forEach((item) => {
        const groupKey = item[xKey];
        if (!groupedData[groupKey]) {
          groupedData[groupKey] = { [xKey]: groupKey };
        }
        groupedData[groupKey][item[categoryKey]] = item[valueKey];
      });

      barData = Object.values(groupedData);
      bars = categories.map((category, index) => (
        <Bar
          key={category}
          dataKey={category}
          fill={COLORS[index % COLORS.length]}
          name={category}
        />
      ));
    } else {
      bars = [<Bar key={valueKey} dataKey={valueKey} fill="#667eea" />];
    }

    return (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={barData}
            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {bars}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderPieChart = (data: any[]) => {
    if (!data || data.length === 0) return null;

    const keys = Object.keys(data[0]);
    let pieData = data;

    if (keys.length > 2) {
      const valueKey = keys[keys.length - 1];
      const nameKey = keys[0];
      const aggregated: Record<string, number> = {};

      data.forEach((item) => {
        const name = item[nameKey];
        aggregated[name] = (aggregated[name] || 0) + Number(item[valueKey]);
      });

      pieData = Object.keys(aggregated).map((name) => ({
        name,
        value: aggregated[name],
      }));
    } else if (keys.length === 2) {
      pieData = data.map((item) => ({
        name: item[keys[0]],
        value: item[keys[1]],
      }));
    }

    return (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, "Count"]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderMessage = (message: Message) => {
    if (message.role === "user" && typeof message.content === "string") {
      return (
        <div key={message.id} className="user-message-container">
          <div className="user-message-wrapper">
            <div className="user-message-bubble">
              <p className="message-text">{message.content}</p>
            </div>
            <div className="user-avatar">
              <User size={16} />
            </div>
          </div>
        </div>
      );
    } else {
      const responseData =
        typeof message.content === "object"
          ? (message.content as ResponseData)
          : null;

      return (
        <div key={message.id} className="bot-message-container">
          <div className="bot-message-wrapper">
            <div className="bot-avatar">
              <Bot size={16} />
            </div>
            <div className="bot-message-bubble">
              {responseData?.response ? (
                <div className="response-content">
                  {responseData.response.text && (
                    <p className="message-text">{responseData.response.text}</p>
                  )}

                  {responseData.response.component === "table" &&
                    responseData.response.result &&
                    renderTable(responseData.response.result)}

                  {responseData.response.component === "list" &&
                    responseData.response.result &&
                    renderList(responseData.response.result)}

                  {responseData.response.component === "bar_chart" &&
                    responseData.response.result &&
                    renderBarChart(responseData.response.result)}

                  {responseData.response.component === "pie_chart" &&
                    responseData.response.result &&
                    renderPieChart(responseData.response.result)}
                </div>
              ) : typeof message.content === "object" ? (
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

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-content">
          <div className="chat-header-left">
            <div className="chat-header-avatar">
              <Bot size={24} />
            </div>
            <div className="chat-header-info">
              <h1 className="chat-header-title">AI Assistant</h1>
              <p className="chat-header-subtitle">
                <span className="status-dot"></span>
                Online
              </p>
            </div>
          </div>
          <button
            onClick={handleClear}
            disabled={isClearing}
            className="clear-button"
            title="Clear Chat"
          >
            <Trash2 size={18} />
            <span className="clear-button-text">
              {isClearing ? "Clearing..." : "Clear"}
            </span>
          </button>
        </div>
      </div>

      <div className="chat-messages-container">
        <div className="chat-messages-wrapper">
          {messages.map(renderMessage)}

          {isTyping && (
            <div className="typing-container">
              <div className="typing-wrapper">
                <div className="bot-avatar">
                  <Bot size={16} />
                </div>
                <div className="typing-bubble">
                  <div className="typing-dots">
                    <div className="typing-dot typing-dot-1"></div>
                    <div className="typing-dot typing-dot-2"></div>
                    <div className="typing-dot typing-dot-3"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-container">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="chat-textarea"
            rows={1}
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="chat-send-button"
            title="Send Message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

   
    </div>
  );
};

export default ChatInterface;