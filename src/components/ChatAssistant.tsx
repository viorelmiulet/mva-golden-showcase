import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/integrations/supabase/client"
import { 
  Send, 
  MessageSquare, 
  Bot,
  User,
  Loader2
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const ChatAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Adaugă mesajul de bun venit
    const welcomeMessage: Message = {
      role: 'assistant',
      content: 'Bună ziua! Sunt asistentul virtual MVA Imobiliare. Te pot ajuta să găsești proprietatea perfectă din portofoliul nostru de complexe rezidențiale premium din vestul Bucureștiului. Cu ce te pot ajuta astăzi?',
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: { 
          message: inputMessage,
          conversationHistory: conversationHistory
        }
      })

      if (error) {
        throw error
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      setConversationHistory(data.conversationHistory || [])

    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Eroare",
        description: "Nu am putut procesa mesajul. Te rugăm să încerci din nou.",
        variant: "destructive",
      })

      const errorMessage: Message = {
        role: 'assistant',
        content: 'Ne pare rău, a apărut o problemă tehnică. Te rugăm să încerci din nou sau contactează-ne direct la telefon.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <section id="contact" className="py-24 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 mb-6">
              <MessageSquare className="w-4 h-4 mr-2" />
              Asistent Virtual
            </Badge>
            
            <h2 className="text-5xl md:text-6xl font-bold mb-8">
              <span className="text-foreground">Discută cu </span>
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                Asistentul AI
              </span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Asistentul nostru virtual îți poate oferi informații despre proprietăți, 
              preturi și îți poate programa o vizită. Întreabă orice despre proiectele noastre!
            </p>
          </div>

          {/* Chat Interface */}
          <Card className="border-gold/20 bg-card/50 backdrop-blur-sm shadow-2xl">
            <CardContent className="p-0">
              
              {/* Chat Messages */}
              <ScrollArea className="h-[500px] p-6">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot className="w-4 h-4 text-gold" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-gold text-primary-foreground ml-12'
                            : 'bg-secondary/50 text-foreground mr-12'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <div className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString('ro-RO', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="w-4 h-4 text-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-gold" />
                      </div>
                      <div className="bg-secondary/50 rounded-2xl px-4 py-3 mr-12">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-gold" />
                          <span className="text-sm text-muted-foreground">Asistentul scrie...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Chat Input */}
              <div className="border-t border-gold/20 p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Scrie mesajul tău aici... (apasă Enter pentru a trimite)"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="flex-1 border-gold/20 focus:border-gold/50 bg-background/50"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    variant="luxury"
                    size="icon"
                    className="shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground mt-2 text-center">
                  Asistentul poate ajuta cu informații despre proprietăți, programarea vizitelor și întrebări generale.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 rounded-2xl p-6 border border-gold/20 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-foreground mb-3">
                Sau Contactează-ne Direct
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
                <span className="text-muted-foreground">📞 Tel: 0767941512</span>
                <span className="text-muted-foreground">✉️ Email: mvaperfectbusiness@gmail.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ChatAssistant