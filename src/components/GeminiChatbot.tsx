import React, { useState, useRef, useEffect } from "react";
import { askGeminiAgent } from "../services/geminiAgent";

const GeminiChatbot = () => {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! I am KiwamiTestCloud, your QA assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const synthRef = useRef(window.speechSynthesis);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read welcome message aloud for accessibility
    if (open && messages.length === 1) {
      speak(messages[0].text);
    }
  }, [open, messages]);

  useEffect(() => {
    // Scroll to bottom on new message
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const speak = (text) => {
    if (synthRef.current) {
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      utter.rate = 1;
      utter.pitch = 1;
      synthRef.current.speak(utter);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const userMsg = { sender: "user", text: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    try {
      const botText = await askGeminiAgent(input);
      setMessages((msgs) => [...msgs, { sender: "bot", text: botText }]);
      speak(botText);
    } catch (err) {
      console.error("Error sending message to Gemini:", err);
      let errorMessage = "Error connecting to KiwamiTestCloud.";
      if (err instanceof Error) {
        // Provide more specific error messages based on the error type
        if (err.message.includes("API key")) {
          errorMessage = "API configuration error. Please contact support.";
        } else if (err.message.includes("network")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      }
      setMessages((msgs) => [...msgs, { sender: "bot", text: errorMessage }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chatbot FAB */}
      <button
        className="bg-blue-600 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl hover:bg-blue-700 transition-all"
        aria-label="Open KiwamiTestCloud chatbot"
        onClick={() => setOpen((v) => !v)}
      >
        💬
      </button>
      {open && (
        <div
          className="absolute bottom-20 right-0 w-80 sm:w-96 max-w-xs sm:max-w-full bg-card text-card-foreground border border-border rounded-xl shadow-xl p-3 sm:p-4 flex flex-col gap-3"
          role="dialog"
          aria-label="KiwamiTestCloud chatbot"
          style={{ minWidth: "260px", maxWidth: "95vw" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-primary text-lg">KiwamiTestCloud</span>
            <button className="text-muted-foreground hover:text-foreground text-xl" aria-label="Close chatbot" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>
          <div ref={chatRef} className="h-64 overflow-y-auto mb-2" aria-live="polite">
            {messages.map((msg, i) => (
              <div key={i} className={`mb-2 text-sm ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                <span className={msg.sender === "user" ? "bg-primary/10 text-primary border border-primary/10 px-3 py-2 rounded-lg inline-block" : "bg-muted text-muted-foreground border border-border px-3 py-2 rounded-lg inline-block"}>{msg.text}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-input bg-background text-foreground rounded-lg px-3 py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask KiwamiTestCloud..."
              aria-label="Chat input"
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/95"
              onClick={sendMessage}
              disabled={loading}
              aria-label="Send message"
            >
              Send
            </button>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
              onClick={() => speak(messages[messages.length - 1]?.text || "")}
              aria-label="Read last message aloud"
            >
              🔊 Listen
            </button>
            <button
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
              onClick={() => setMessages([{ sender: "bot", text: "Hello! I am KiwamiTestCloud, your QA assistant. How can I help you today?" }])}
              aria-label="Clear chat"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiChatbot;
