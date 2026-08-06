"use client";

import React, { useState, useEffect, useRef } from "react";
import { Ico } from "@/lib/constants"; // Assuming Ico is available in constants
import { Bot } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotWidget({ businessId, bizName, primaryColor = "#6366f1", chatbotName = "Asistente Virtual" }: { businessId: string, bizName: string, primaryColor?: string, chatbotName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: `¡Hola! Soy ${chatbotName} de ${bizName}. ¿En qué te puedo ayudar hoy?` }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, messages: newMessages, chatbotName })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Lo siento, tuve un problema al procesar tu solicitud." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Lo siento, parece que hay un error de conexión." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-transform hover:scale-110"
        style={{ background: primaryColor }}
      >
        {isOpen ? <Ico n="x" s={24} /> : <Bot size={28} />}
      </button>

      {/* Ventana de Chat */}
      {isOpen && (
        <div 
          className="fixed bottom-24 right-6 z-[9999] w-[350px] h-[500px] max-h-[80vh] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp"
          style={{ border: "1px solid rgba(0,0,0,0.1)", animation: "slideUp 0.3s ease-out forwards" }}
        >
          {/* Header */}
          <div className="p-4 text-white flex justify-between items-center" style={{ background: primaryColor }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">{chatbotName}</h3>
                <p className="text-[10px] text-white/80">Respondemos al instante ⚡</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <Ico n="x" s={18} />
            </button>
          </div>

          {/* Area de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === "user" 
                    ? "bg-slate-800 text-white self-end rounded-br-sm" 
                    : "bg-white text-slate-800 self-start rounded-bl-sm border border-slate-100 shadow-sm"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="bg-white text-slate-500 self-start p-3 rounded-2xl rounded-bl-sm border border-slate-100 shadow-sm max-w-[85%] text-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 bg-slate-100 text-slate-800 text-sm px-4 py-2.5 rounded-full border border-transparent focus:border-slate-300 focus:outline-none focus:bg-white transition-colors"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-50"
              style={{ background: primaryColor }}
            >
              <Ico n="send" s={16} />
            </button>
          </form>
          
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            .animate-slideUp { animation: slideUp 0.3s ease-out forwards; }
          `}} />
        </div>
      )}
    </>
  );
}
