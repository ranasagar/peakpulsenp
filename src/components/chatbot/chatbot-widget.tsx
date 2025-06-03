
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Send, X, Bot, User, Loader2, Trash2 } from 'lucide-react';
import type { ChatMessage } from '@/types';
import { aiChatbotConcierge } from '@/ai/flows/ai-chatbot-concierge';
import type { AiChatbotConciergeInput } from '@/ai/flows/ai-chatbot-concierge';
import { Icons } from '@/components/icons';
import { useAuth } from '@/hooks/use-auth'; // Added useAuth import

const initialMessage: ChatMessage = {
  id: 'initial',
  role: 'assistant',
  content: 'Hello! How can I help you today at Peak Pulse?',
  timestamp: Date.now()
};

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null); 
  const { user } = useAuth(); // Get current user from AuthContext

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Determine initial message based on user role
      const isAdmin = user && user.roles?.includes('admin');
      const firstMessageContent = isAdmin 
        ? 'Hello Admin! How can I assist with Peak Pulse strategy today? Ask about trends, designs, business, or marketing.'
        : 'Hello! How can I help you today at Peak Pulse?';
      
      setMessages([{
        id: 'initial',
        role: 'assistant',
        content: firstMessageContent,
        timestamp: Date.now()
      }]);
    }
  }, [isOpen, messages.length, user]);
  
  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, [messages]);

  const handleClearChat = () => {
    const isAdmin = user && user.roles?.includes('admin');
    const firstMessageContent = isAdmin 
        ? 'Hello Admin! How can I assist with Peak Pulse strategy today? Ask about trends, designs, business, or marketing.'
        : 'Hello! How can I help you today at Peak Pulse?';
    setMessages([{
        id: 'initial-cleared',
        role: 'assistant',
        content: firstMessageContent,
        timestamp: Date.now()
      }]);
    setInputValue(''); 
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInputValue = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const isAdmin = user && user.roles?.includes('admin');
      const aiInput: AiChatbotConciergeInput = { 
        query: currentInputValue,
        isAdmin: isAdmin, // Pass isAdmin flag to the AI flow
      }; 
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
        <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={handleClearChat} className="h-8 w-8 mr-1 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Clear chat</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
              <X className="h-5 w-5" />
              <span className="sr-only">Close chat</span>
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-full" viewportRef={scrollViewportRef}>
          <div className="p-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end max-w-[80%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {msg.role === 'assistant' && <Icons.Logo className="h-6 w-6 mb-1 text-primary flex-shrink-0" />}
                    {msg.role === 'user' && <User className="h-6 w-6 mb-1 text-accent flex-shrink-0" />}
                    <div
                    className={`px-4 py-2.5 rounded-xl text-sm whitespace-pre-line
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
          <Button type="submit" size="icon" className="h-10 w-10" disabled={isLoading || !inputValue.trim()}>
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

