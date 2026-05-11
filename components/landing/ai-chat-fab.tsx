"use client";

import { useState, useRef, useEffect } from "react";
import { Brain, X, Send, Zap } from "lucide-react";
import type { LandingPageContent } from "@/lib/landing-types";

type AIChatFabProps = {
  readonly config: LandingPageContent["sections"]["chat"];
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function AIChatFab({ config }: AIChatFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: config.welcomeMessage },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (placeholder for actual AI integration)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "Gracias por tu pregunta. Estamos en fase de desarrollo y pronto podras chatear con nuestra IA sobre tu auto. Mientras tanto, sumate a la lista de espera para ser de los primeros en acceder.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <>
      {/* FAB Button */}
      <div className="al-chat-fab-wrap">
        {!isOpen && (
          <span className="al-chat-fab-tooltip" role="tooltip">
            {config.fabTooltip}
          </span>
        )}
        <button
          type="button"
          className="al-chat-fab"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Cerrar chat" : config.fabTooltip}
        >
          {isOpen ? <X size={24} aria-hidden /> : <Brain size={24} aria-hidden />}
        </button>
      </div>

      {/* Chat Panel */}
      <div className={`al-chat-panel ${isOpen ? "al-chat-panel-open" : ""}`} role="dialog" aria-label="Chat con AutoLibre">
        <header className="al-chat-header">
          <div className="al-chat-title">
            <span className="al-chat-icon">
              <Zap size={14} aria-hidden />
            </span>
            <span>{config.panelTitle}</span>
          </div>
          <button
            type="button"
            className="al-chat-close"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar chat"
          >
            <X size={20} aria-hidden />
          </button>
        </header>

        <div className="al-chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`al-chat-message ${message.role === "user" ? "al-chat-message-user" : "al-chat-message-assistant"}`}
            >
              {message.content}
            </div>
          ))}
          {isLoading && (
            <div className="al-chat-message al-chat-message-assistant al-chat-loading">
              <span className="al-chat-dot" />
              <span className="al-chat-dot" />
              <span className="al-chat-dot" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="al-chat-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={config.placeholder}
            disabled={isLoading}
            className="al-chat-input"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="al-chat-send"
            aria-label="Enviar mensaje"
          >
            <Send size={18} aria-hidden />
          </button>
        </form>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="al-chat-backdrop" 
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
}
