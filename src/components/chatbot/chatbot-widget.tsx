
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Send, X, Bot, User, Loader2 } from 'lucide-react';
import type { ChatMessage } from '@/types';
import { aiChatbotConcierge } from '@/ai/flows/ai-chatbot-concierge';
import type { AiChatbotConciergeInput } from '@/ai/flows/ai-chatbot-concierge';
import { Icons } from '@/components/icons'; // Added import for Icons.Logo

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { id: 'initial', role: 'assistant', content: 'Hello! How can I help you today at Peak Pulse?', timestamp: Date.now() }
      ]);
    }
  }, [isOpen, messages.length]);
  
  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollableView = scrollAreaRef.current.querySelector('div > div'); // Target the viewport div
      if (scrollableView) {
        scrollableView.scrollTop = scrollableView.scrollHeight;
      }
    }
  }, [messages]);


  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiInput: AiChatbotConciergeInput = { query: userMessage.content };
      const aiResponse = await aiChatbotConcierge(aiInput);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="default"
        size="lg"
        className="fixed bottom-6 right-6 rounded-full shadow-xl p-4 h-16 w-16 z-50"
        onClick={() => setIsOpen(true)}
        aria-label="Open Chat"
      >
        <MessageSquare className="h-7 w-7" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-full max-w-sm h-[70vh] max-h-[600px] z-50 flex flex-col shadow-2xl rounded-xl border-border/80 bg-card">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
            <Icons.Logo className="h-7 w-7 text-primary" /> 
            <CardTitle className="text-lg font-semibold">Peak Pulse Help</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
          <X className="h-5 w-5" />
          <span className="sr-only">Close chat</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end max-w-[80%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {msg.role === 'assistant' && <Icons.Logo className="h-6 w-6 mb-1 text-primary flex-shrink-0" />}
                    {msg.role === 'user' && <User className="h-6 w-6 mb-1 text-accent flex-shrink-0" />}
                    <div
                    className={`px-4 py-2.5 rounded-xl text-sm
                        ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted text-foreground rounded-bl-none'}`}
                    >
                    {msg.content}
                    </div>
                </div>
              </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="flex items-end max-w-[80%] gap-2">
                        <Icons.Logo className="h-6 w-6 mb-1 text-primary flex-shrink-0" />
                        <div className="px-4 py-2.5 rounded-xl text-sm bg-muted text-foreground rounded-bl-none">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex w-full items-center space-x-2"
        >
          <Input
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-grow h-10"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" className="h-10 w-10" disabled={isLoading}>
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
