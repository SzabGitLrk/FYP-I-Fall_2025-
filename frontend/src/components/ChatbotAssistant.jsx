import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, X, Minus, Plus } from 'lucide-react';

const ChatbotAssistant = ({ reportType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  
  const getInitialMessage = () => {
    if (reportType === 'HBA1C') {
      return 'Hello! I am your HbA1c Assistant. How can I help you understand your blood sugar results today?';
    } else if (reportType === 'CREATININE') {
      return 'Hello! I am your Kidney Function Assistant. How can I help you understand your creatinine levels today?';
    }
    return 'Hello! I am your Report Assistant. How can I help you understand your test results today?';
  };

  const [chatHistory, setChatHistory] = useState([
    { role: 'bot', content: getInitialMessage() }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Suggested questions based on report type
  const suggestions = reportType === 'HBA1C' ? [
    "What is my HbA1c level?",
    "What is HbA1c?",
    "Is my HbA1c normal?",
    "How can I reduce HbA1c?",
    "What foods affect HbA1c?"
  ] : [
    "What is my WBC count?",
    "Is my hemoglobin low?",
    "Show my summary",
    "What is RBC?"
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSendMessage = async (e, text = null) => {
    if (e) e.preventDefault();
    const userMsg = text || message.trim();
    if (!userMsg) return;

    if (!text) setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await response.json();
      if (data.response) {
        setChatHistory(prev => [...prev, { role: 'bot', content: data.response }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'bot', content: 'Sorry, I encountered an error. Please try again.' }]);
      }
    } catch (error) {
      console.error('Chat Error:', error);
      setChatHistory(prev => [...prev, { role: 'bot', content: 'Could not connect to the assistant. Please ensure the backend is running.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-teal-600" />
          Ask Your Assistant
        </h3>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center"
        >
          {isOpen ? (
            <>
              <Minus className="w-4 h-4 mr-1" /> Hide Chat
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-1" /> Show Chat
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden flex flex-col h-[500px]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-teal-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none p-3 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestions */}
          <div className="px-4 py-2 flex flex-wrap gap-2 bg-gray-50 border-t border-gray-100">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(null, s)}
                className="text-xs bg-white border border-teal-100 text-teal-700 px-3 py-1.5 rounded-full hover:bg-teal-50 transition-colors shadow-sm"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about your report..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatbotAssistant;
