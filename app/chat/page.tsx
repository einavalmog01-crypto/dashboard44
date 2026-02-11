"use client";

import React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Code,
  FileText,
  Bug,
  Loader2,
  Paperclip,
  X,
  Image as ImageIcon,
  FileIcon,
} from "lucide-react";
import { useEnvironment } from "@/lib/environment-context";

interface Attachment {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
  base64?: string;
}

interface MessageAttachment {
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: MessageAttachment[];
}

const suggestedPrompts = [
  {
    icon: Code,
    label: "Generate test cases",
    prompt: "Generate test cases for the login functionality",
  },
  {
    icon: Bug,
    label: "Debug failing test",
    prompt: "Help me debug why my API endpoint test is failing",
  },
  {
    icon: FileText,
    label: "Write test documentation",
    prompt: "Write documentation for my test suite",
  },
  {
    icon: Sparkles,
    label: "Optimize test suite",
    prompt: "Suggest ways to optimize my test suite performance",
  },
];

export default function ChatPage() {
  const { selectedEnv, currentEnvironmentConfig } = useEnvironment();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI assistant powered by Cursor CLI. I can help you with coding questions, debugging, documentation, and more. You can also attach images or documents for me to review. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEnvConfigured = currentEnvironmentConfig?.isConfigured ?? false;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const maxSize = 10 * 1024 * 1024; // 10MB

    const newAttachments: Attachment[] = [];
    for (const file of fileArray) {
      if (file.size > maxSize) {
        alert(`File "${file.name}" exceeds the 10MB limit.`);
        continue;
      }
      const isImage = file.type.startsWith("image/");
      const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
      const base64 = await fileToBase64(file);

      newAttachments.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        previewUrl,
        base64,
      });
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att?.previewUrl) URL.revokeObjectURL(att.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSend = async (message: string) => {
    if (!message.trim() && attachments.length === 0) return;

    const messageAttachments: MessageAttachment[] = attachments.map((a) => ({
      name: a.name,
      type: a.type,
      size: a.size,
      previewUrl: a.previewUrl,
    }));

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
      attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
    };

    let fullPrompt = message;
    if (attachments.length > 0) {
      const fileDescriptions = attachments
        .map((a) => `[Attached file: ${a.name} (${a.type}, ${formatFileSize(a.size)})]`)
        .join("\n");
      fullPrompt = `${fileDescriptions}\n\n${message}`;
    }

    const attachmentData = attachments.map((a) => ({
      name: a.name,
      type: a.type,
      size: a.size,
      base64: a.base64,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: fullPrompt,
          environment: selectedEnv || "default",
          attachments: attachmentData,
          config: currentEnvironmentConfig
            ? {
                auth: currentEnvironmentConfig.auth,
                endpoint: currentEnvironmentConfig.endpoint,
                unix: currentEnvironmentConfig.unix,
              }
            : {},
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply ?? data.error ?? "No response from backend",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          err?.message || "Error connecting to Cursor CLI. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <DashboardLayout
      title="AI Chat"
      description="Chat with Cursor CLI AI assistant"
    >
      <div
        className="-m-6 flex h-[calc(100%+3rem)] flex-col overflow-hidden"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-primary p-10">
              <Paperclip className="h-10 w-10 text-primary" />
              <p className="text-lg font-medium text-primary">
                Drop files here to attach
              </p>
              <p className="text-sm text-muted-foreground">
                Images, documents, and more (max 10MB each)
              </p>
            </div>
          </div>
        )}

        <div className="border-b border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">AI Testing Assistant</h1>
              <p className="text-sm text-muted-foreground">
                Powered by Cursor CLI
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              Cursor CLI Ready
            </Badge>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollRef}>
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border"
                  }`}
                >
                  {/* Attachment previews in message */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {message.attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${
                            message.role === "user"
                              ? "bg-primary-foreground/15"
                              : "bg-muted"
                          }`}
                        >
                          {att.type.startsWith("image/") ? (
                            att.previewUrl ? (
                              <img
                                src={att.previewUrl}
                                alt={att.name}
                                className="h-16 w-16 rounded object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-4 w-4 shrink-0" />
                            )
                          ) : (
                            <FileIcon className="h-4 w-4 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium">{att.name}</p>
                            <p className="opacity-70">
                              {formatFileSize(att.size)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {message.content && (
                    <p className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </p>
                  )}
                  <p
                    className={`mt-2 text-xs ${
                      message.role === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <User className="h-4 w-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Thinking...
                  </span>
                </div>
              </div>
            )}

            {messages.length === 1 && (
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {suggestedPrompts.map((prompt) => (
                  <Card
                    key={prompt.label}
                    className="cursor-pointer p-4 transition-colors hover:bg-secondary/50"
                    onClick={() => handleSend(prompt.prompt)}
                  >
                    <div className="flex items-center gap-3">
                      <prompt.icon className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{prompt.label}</p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {prompt.prompt}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t border-border p-4">
          <div className="mx-auto max-w-3xl">
            {/* Attachment preview strip */}
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="group relative flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2"
                  >
                    {att.previewUrl ? (
                      <img
                        src={att.previewUrl}
                        alt={att.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 max-w-[120px]">
                      <p className="truncate text-xs font-medium">{att.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(att.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={`Remove ${att.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-3"
            >
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml,.yaml,.yml,.md,.log,.html,.css,.js,.ts,.tsx,.jsx,.py,.java,.c,.cpp,.go,.rs,.rb,.sh,.sql"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }
                }}
              />

              {/* Attach button */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-[56px] w-[56px] shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                aria-label="Attach files"
              >
                <Paperclip className="h-5 w-5" />
              </Button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if ((input.trim() || attachments.length > 0) && !isLoading) {
                      handleSend(input);
                    }
                  }
                }}
                placeholder={
                  attachments.length > 0
                    ? "Add a message about the attached files..."
                    : "Ask me anything about testing..."
                }
                className="flex-1 min-h-[56px] max-h-[200px] resize-none rounded-md border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
                rows={2}
              />
              <Button
                type="submit"
                disabled={isLoading || (!input.trim() && attachments.length === 0)}
                className="h-[56px] px-4"
              >
                <Send className="h-5 w-5" />
                <span className="sr-only">Send message</span>
              </Button>
            </form>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Attach images or documents with the paperclip button or drag and
              drop files anywhere in the chat.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
