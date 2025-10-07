import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { useChat, type Message } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import sofiaAvatar from '@/assets/sofia-avatar.png';

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
    // Split into paragraphs
    let formatted = content;
    
    // Convert URLs to clickable links with better styling
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-gold underline hover:text-gold-light font-medium break-all inline-block">🔗 Vezi aici</a>');
    
    // Format emoji bullets and lists
    formatted = formatted.replace(/^([📍💰📐🏠📝✨🔗])/gm, '<span class="inline-block mr-1">$1</span>');
    
    // Format numbered lists (1., 2., etc.)
    formatted = formatted.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="mb-2"><span class="font-semibold text-gold">$1.</span> $2</div>');
    
    // Add line breaks for better readability
    formatted = formatted.replace(/\n/g, '<br/>');
    
    // Format bold text (optional, if using **text**)
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    return formatted;
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <Button
          onClick={handleToggleChat}
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-r from-primary to-gold-light shadow-lg hover:shadow-xl transition-all duration-300 group touch-manipulation"
          aria-label="Deschide chat-ul AI"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-black group-hover:scale-110 transition-transform" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 left-0 sm:bottom-4 sm:right-4 sm:left-auto z-50 sm:max-w-sm">
      <Card className="w-full h-[85vh] sm:h-[500px] sm:w-96 bg-background border-border shadow-2xl flex flex-col overflow-hidden backdrop-blur-none sm:rounded-lg rounded-t-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-gold-light p-3 sm:p-4 flex items-center justify-between text-black">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-black/20 flex-shrink-0">
              <img 
                src={sofiaAvatar} 
                alt="Sofia AI Assistant" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Sofia</h3>
              <p className="text-xs opacity-80">asistentul tău AI</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-black hover:bg-black/20 h-9 w-9 sm:h-10 sm:w-10 p-0 touch-manipulation"
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-3 sm:p-4">
          <div className="space-y-3 sm:space-y-4">
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="bg-secondary text-foreground rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm mr-2 sm:mr-4 leading-relaxed shadow-sm">
                  <div>
                    <p className="font-medium mb-2">Bună! Sunt Sofia, asistentul tău AI pentru MVA Imobiliare.</p>
                    <p>Vă pot ajuta să găsiți proprietatea perfectă din portofoliul nostru. Cu ce vă pot ajuta astăzi?</p>
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
                    "max-w-[85%] sm:max-w-[85%] rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm leading-relaxed shadow-sm",
                    message.role === 'user'
                      ? "bg-primary text-black ml-2 sm:ml-4"
                      : "bg-secondary text-foreground mr-2 sm:mr-4"
                  )}
                >
                  <div 
                    className="whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{ 
                      __html: formatMessageContent(message.content) 
                    }} 
                  />
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary text-foreground rounded-lg px-3 py-2 text-xs sm:text-sm mr-2 sm:mr-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-border">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Scrieți mesajul..."
              disabled={isLoading}
              className="flex-1 text-sm h-10 sm:h-9"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputMessage.trim() || isLoading}
              className="bg-primary hover:bg-primary/90 text-black h-10 w-10 sm:h-9 sm:w-auto sm:px-3 p-0 sm:p-2 touch-manipulation"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>

      </Card>
    </div>
  );
};

export default ChatWidget;