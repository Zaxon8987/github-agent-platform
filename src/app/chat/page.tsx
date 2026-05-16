"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, User, Plus, Trash2, MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type ChatMessage = {
  id?: string;
  role: string;
  content: string;
};

type ChatHistory = {
  id: string;
  title: string;
  model: string;
  updatedAt: string;
  messages?: { content: string }[];
};

const MODELS = [
  { id: "openai/gpt-4o", name: "GPT-4o", short: "4o" },
  { id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet", short: "Claude" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", short: "Gemini" },
  { id: "qwen/qwen-3.6-max", name: "Qwen 3.6 Max", short: "Qwen" },
];

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatIdParam = searchParams.get("id");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatIdParam);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/chat/history")
        .then((r) => r.json())
        .then(setChats)
        .catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    if (currentChatId && session) {
      fetch(`/api/chat/${currentChatId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.messages) setMessages(data.messages);
        })
        .catch(() => {});
    }
  }, [currentChatId, session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          chatId: currentChatId,
          model: selectedModel.id,
        }),
      });

      const data = await res.json();

      if (data.chatId) {
        setCurrentChatId(data.chatId);
        fetch("/api/chat/history")
          .then((r) => r.json())
          .then(setChats);
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: data.content || "No response",
          id: data.message?.id,
        };
        return updated;
      });
    } catch (e: any) {
      toast.error("Failed to send message");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, [input, loading, currentChatId, selectedModel.id]);

  const newChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setInput("");
    router.push("/chat");
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="w-64 border-r border-border p-2 flex flex-col gap-1 hidden md:flex">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 justify-start mb-2"
          onClick={newChat}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>

        <div className="flex-1 overflow-y-auto space-y-1">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => {
                setCurrentChatId(chat.id);
                router.push(`/chat?id=${chat.id}`);
              }}
              className={`w-full text-left p-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                currentChatId === chat.id
                  ? "bg-accent"
                  : "hover:bg-accent/50"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{chat.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="border-b border-border p-3 flex items-center justify-between">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowModelPicker(!showModelPicker)}
            >
              <Sparkles className="h-4 w-4 text-primary" />
              {selectedModel.short}
            </Button>
            {showModelPicker && (
              <div className="absolute top-full mt-1 left-0 bg-background border border-border rounded-md shadow-lg z-50 w-48">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    className={`w-full text-left p-2 text-sm hover:bg-accent ${
                      selectedModel.id === m.id ? "bg-accent" : ""
                    }`}
                    onClick={() => {
                      setSelectedModel(m);
                      setShowModelPicker(false);
                    }}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {currentChatId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={newChat}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="h-16 w-16 text-primary/30 mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                GitHub Agent Platform
              </h2>
              <p className="text-muted-foreground max-w-md">
                Ask me anything about your GitHub repos, or tell me to orchestrate
                a multi-agent swarm to accomplish complex tasks.
              </p>
              <div className="flex gap-2 mt-4">
                <Badge variant="secondary">Create an issue</Badge>
                <Badge variant="secondary">Review PRs</Badge>
                <Badge variant="secondary">Analyze repos</Badge>
                <Badge variant="secondary">Deploy swarm</Badge>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role !== "user" && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content || (loading ? "..." : "")}</div>
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2 max-w-4xl mx-auto"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about repos, create issues, or deploy agent swarms..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
