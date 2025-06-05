import React, { useState, useRef, useEffect } from "react";
import { Send, User, Bot, PlusIcon, LightbulbIcon } from "lucide-react";
import "./App.css";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Types
type BotComponentType =
  | "text"
  | "table"
  | "list"
  | "pie_chart"
  | "bar_chart";

type BarChartData = {
  [key: string]: string | number;
};

type BarChartContent = {
  title?: string;
  name?: string;
  xAxis?: string;
  yAxis?: string;
  data: BarChartData[];
};

type TableContent =
  | {
    title?: string;
    columns: string[];
    rows: any[][];
  }
  | Record<string, any>[];

type PieChartData = {
  name: string;
  value: number;
};

type PieChartContent = {
  title?: string;
  data: PieChartData[];
};

type BotMessage = {
  component: BotComponentType;
  content: string | TableContent | string[] | PieChartContent | BarChartContent;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string | BotMessage[];
  timestamp: Date;
};

// API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Chart colors
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

const defaultPrompts = [
  "Which department has the highest number of employees?",
  "What is the distribution of employees by designation?",
  "Are there any departments with outstanding (unresolved) maintenance issues?",
  "Who are the top vendors providing maintenance services most frequently",
  "Are there any batches that experienced delivery delays?",
  "Which are the assets frequently getting damaged?"
];

function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, (txt) => txt[0].toUpperCase() + txt.slice(1));
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [useRAG, setUseRAG] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`);
      const data: Message[] = await response.json();
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: "Hello! How can I help you today?",
          timestamp: new Date(),
        },
        ...data.map((message, index) => ({
          ...message,
          id: `${index + 2}`,
          timestamp: new Date(message.timestamp),
        })),
      ]);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      // Set default message if fetch fails
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

  const clearChat = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/clear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Reset to initial state
        setMessages([
          {
            id: "1",
            role: "assistant",
            content: "Hello! How can I help you today?",
            timestamp: new Date(),
          },
        ]);
        setInputValue("");
        setShowPrompts(false);
      } else {
        console.error("Failed to clear chat");
      }
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat?rag=${useRAG}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: currentInput }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData: { response: BotMessage[] } = await response.json();

      const botMessage: Message = {
        id: `${Date.now()}-bot`,
        role: "assistant",
        content: responseData.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Failed to get response: ", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: "assistant",
          content: [
            { component: "text", content: "I'm sorry, something went wrong." },
          ],
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptSelect = (prompt: string) => {
    setInputValue(prompt);
    setShowPrompts(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="container">
      <div className="chat-header">
        <div className="chat-header-content">
          <div className="chat-header-left">
            <div className="chat-header-avatar">
              <Bot size={20} color="white" />
            </div>
            <div>
              <h1 className="chat-header-title">Lark AI</h1>
              <p className="chat-header-subtitle">Online</p>
            </div>
          </div>
          <div className="chat-header-right">
            <div className="rag-toggle">
              <label className="toggle-label">
                <span className="toggle-text">PRO</span>
                <input
                  type="checkbox"
                  checked={useRAG}
                  onChange={() => setUseRAG(!useRAG)}
                  className="toggle-input"
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <button
              onClick={clearChat}
              className="new-chat-button"
              title="Start New Chat"
            >
              <span>New</span>
              <PlusIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="chat-messages-container">
        <div className="chat-messages-wrapper">
          {messages.map((msg) => (
            <RenderMessage key={msg.id} message={msg} />
          ))}

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

      {showPrompts && (
        <div className="prompt-list">
          {defaultPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptSelect(prompt)}
              className="prompt-item"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
      <div className="chat-input-area">
        <div className="chat-input-container">
          <button
            onClick={() => setShowPrompts(!showPrompts)}
            className="prompt-toggle-button"
            aria-label="Toggle Prompts"
          >
            <LightbulbIcon size={16} color="black" />
          </button>
          <textarea
            ref={inputRef}
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

const RenderMessage = ({ message }: { message: Message }) => {
  if (message.role === "user" && typeof message.content === "string") {
    return (
      <div className="user-message-container">
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
  }

  return (
    <div className="bot-message-container">
      <div className="bot-message-wrapper">
        <div className="bot-avatar">
          <Bot size={16} color="white" />
        </div>
        <div className="bot-message-bubble">
          {typeof message.content === "string" ? (
            <p className="message-text">{message.content}</p>
          ) : (
            message.content.map((component, index) => (
              <RenderComponent key={index} component={component} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{`${label || payload[0].name}`}</p>
        <p className="tooltip-value">{`${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const RenderComponent = ({ component }: { component: BotMessage }) => {
  if (component.component === "text") {
    return <p className="message-text">{String(component.content)}</p>;
  }

  if (component.component === "list") {
    return (
      <ul className="list">
        {(Array.isArray(component.content)
          ? component.content
          : [component.content]
        ).map((item, idx) => (
          <li key={idx} className="list-item">
            {String(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (component.component === "table") {
    const content = component.content as TableContent;
    const isStructured =
      !Array.isArray(content) && "columns" in content && "rows" in content;
    const columns = isStructured
      ? content.columns
      : Object.keys((content as any[])[0] || {});
    const rows = isStructured
      ? content.rows
      : (content as any[]).map((obj) => Object.values(obj));

    if (rows.length === 0) return null;

    return (
      <div className="table-component">
        <div className="table-header">
          {isStructured && content.title ? content.title : "Data Table"}
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, i) => (
                    <td key={i}>{String(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (component.component === "pie_chart") {
    const content = component.content;
    const isArrayContent = Array.isArray(content);
    if (isArrayContent && content.length === 0) return null;

    let data: PieChartData[] = [];
    let nameKey = "name";
    let valueKey = "value";
    let title = "Pie Chart";

    if (isArrayContent) {
      const firstItem = content[0] || {};

      // Try to dynamically infer nameKey and valueKey
      const keys = Object.keys(firstItem);
      if (keys.length >= 2) {
        nameKey = keys[0];
        valueKey = keys[1];
      }

      data = content.map((item: any) => ({
        name: item[nameKey],
        value: item[valueKey],
      }));
    } else {
      const pieContent = content as PieChartContent;
      data = pieContent.data;
      title = pieContent.title || "Pie Chart";
    }

    return (
      <div className="chart-component">
        <h3 className="chart-title">{title}</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {data.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (component.component === "bar_chart") {
    const content = component.content;
    const isArrayContent = Array.isArray(content);
    if (isArrayContent && content.length === 0) return null;

    let data: BarChartData[] = [];
    let xAxis = "name";
    let yAxis = "value";
    let name = "Value";
    let title = "Bar Chart";

    if (isArrayContent) {
      const firstItem = content[0] as BarChartData;
      const keys = Object.keys(firstItem);

      if (keys.length >= 2) {
        xAxis = keys[0];
        yAxis = keys[1];
        name = toTitleCase(yAxis.replace(/_/g, " "));
      }

      data = content as BarChartData[];
    } else {
      const barContent = content as BarChartContent;
      data = barContent.data || [];
      xAxis = barContent.xAxis || "name";
      yAxis = barContent.yAxis || "value";
      name = barContent.name || "Value";
      title = barContent.title || "Bar Chart";
    }

    return (
      <div className="chart-component">
        <h3 className="chart-title">{title}</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey={xAxis} stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip />
              <Legend />
              <Bar dataKey={yAxis} name={name} fill="#8884d8">
                {data.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return null;
};

export default ChatInterface;
