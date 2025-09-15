import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { useChat, type Message } from '@/hooks/useChat';
import { cn } from '@/lib/utils';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const messageToSend = inputMessage.trim();
    setInputMessage('');
    await sendMessage(messageToSend);
  };

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
  };

  const formatMessageContent = (content: string) => {
    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>');
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleToggleChat}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-primary to-gold-light shadow-lg hover:shadow-xl transition-all duration-300 group"
          aria-label="Deschide chat-ul AI"
        >
          <MessageCircle className="h-6 w-6 text-black group-hover:scale-110 transition-transform" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-80 h-96 bg-card border-border shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-gold-light p-4 flex items-center justify-between text-black">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Sofia</h3>
              <p className="text-xs opacity-80">asistentul tău AI</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-black hover:bg-black/20 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="bg-secondary text-foreground rounded-lg px-3 py-2 text-sm mr-4">
                  <div>
                    <p>Bună! Sunt Sofia, asistentul tău AI pentru MVA Imobiliare.</p>
                    <p className="mt-2">Vă pot ajuta să găsiți proprietatea perfectă din portofoliul nostru. Cu ce vă pot ajuta astăzi?</p>
                  </div>
                </div>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex w-full",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    message.role === 'user'
                      ? "bg-primary text-black ml-4"
                      : "bg-secondary text-foreground mr-4"
                  )}
                >
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: formatMessageContent(message.content) 
                    }} 
                  />
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary text-foreground rounded-lg px-3 py-2 text-sm mr-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Scrieți mesajul dvs..."
              disabled={isLoading}
              className="flex-1 text-sm"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputMessage.trim() || isLoading}
              className="bg-primary hover:bg-primary/90 text-black"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Quick Actions */}
        {messages.length === 0 && (
          <div className="p-4 pt-0 space-y-2">
            <p className="text-xs text-muted-foreground mb-2">Întrebări frecvente:</p>
            <div className="grid grid-cols-1 gap-1">
              {[
                "Oferte disponibile",
                "Apartamente 2 camere",
                "Buget până în 100.000 EUR"
              ].map((quickMessage, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setInputMessage(quickMessage);
                    sendMessage(quickMessage);
                  }}
                  className="text-xs h-8 justify-start text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {quickMessage}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ChatWidget;