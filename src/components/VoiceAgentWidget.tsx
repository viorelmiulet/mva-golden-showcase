import { useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, MessageCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VoiceAgentWidgetProps {
  agentId: string;
  propertyContext?: {
    title?: string;
    location?: string;
    price?: number;
    rooms?: number;
    surface?: number;
  };
  className?: string;
  variant?: "floating" | "inline" | "compact";
}

export const VoiceAgentWidget = ({ 
  agentId, 
  propertyContext, 
  className = "",
  variant = "floating"
}: VoiceAgentWidgetProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      toast.success("Conectat la asistentul vocal");
    },
    onDisconnect: () => {
      console.log("Disconnected from agent");
      setIsConnecting(false);
    },
    onMessage: (message) => {
      console.log("Message received:", message);
      if (message.message) {
        setTranscript(prev => [...prev, `Agent: ${message.message}`]);
      }
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      toast.error("Eroare la conexiunea cu agentul vocal");
      setIsConnecting(false);
    },
  });

  const startConversation = useCallback(async () => {
    if (!agentId) {
      toast.error("ID-ul agentului nu este configurat");
      return;
    }

    setIsConnecting(true);
    setTranscript([]);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get token from edge function
      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-conversation-token",
        { body: { agentId } }
      );

      if (error || !data?.token) {
        throw new Error(error?.message || "Nu s-a putut obține token-ul");
      }

      // Start the conversation with WebRTC
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });

      setTranscript(["Conversație începută. Vorbește..."]);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error(error instanceof Error ? error.message : "Eroare la pornirea conversației");
      setIsConnecting(false);
    }
  }, [agentId, conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    setTranscript(prev => [...prev, "Conversație încheiată."]);
  }, [conversation]);

  const toggleMute = useCallback(async () => {
    if (isMuted) {
      await conversation.setVolume({ volume: 1 });
    } else {
      await conversation.setVolume({ volume: 0 });
    }
    setIsMuted(!isMuted);
  }, [conversation, isMuted]);

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  // Compact variant - just a button
  if (variant === "compact") {
    return (
      <Button
        onClick={isConnected ? stopConversation : startConversation}
        disabled={isConnecting}
        variant={isConnected ? "destructive" : "default"}
        size="sm"
        className={className}
      >
        {isConnecting ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : isConnected ? (
          <PhoneOff className="h-4 w-4 mr-2" />
        ) : (
          <Phone className="h-4 w-4 mr-2" />
        )}
        {isConnecting ? "Conectare..." : isConnected ? "Închide" : "Vorbește cu AI"}
      </Button>
    );
  }

  // Floating variant
  if (variant === "floating") {
    return (
      <>
        {/* Floating button */}
        <AnimatePresence>
          {!isExpanded && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={`fixed bottom-24 right-6 z-50 ${className}`}
            >
              <Button
                onClick={() => setIsExpanded(true)}
                size="lg"
                className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded widget */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="fixed bottom-24 right-6 z-50 w-80"
            >
              <Card className="shadow-2xl border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${isConnected ? (isSpeaking ? "bg-green-500 animate-pulse" : "bg-green-500") : "bg-gray-400"}`} />
                      Asistent Vocal AI
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {propertyContext && (
                    <Badge variant="secondary" className="w-fit text-xs">
                      {propertyContext.title || `${propertyContext.rooms} camere, ${propertyContext.surface}mp`}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status */}
                  <div className="text-sm text-muted-foreground text-center">
                    {isConnecting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Se conectează...
                      </span>
                    ) : isConnected ? (
                      isSpeaking ? "Agentul vorbește..." : "Te ascult..."
                    ) : (
                      "Întreabă despre proprietăți"
                    )}
                  </div>

                  {/* Transcript */}
                  {transcript.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto text-sm space-y-1">
                      {transcript.slice(-5).map((line, i) => (
                        <p key={i} className="text-muted-foreground">{line}</p>
                      ))}
                    </div>
                  )}

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-3">
                    {isConnected && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleMute}
                        className="rounded-full"
                      >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </Button>
                    )}

                    <Button
                      onClick={isConnected ? stopConversation : startConversation}
                      disabled={isConnecting}
                      size="lg"
                      variant={isConnected ? "destructive" : "default"}
                      className="rounded-full h-14 w-14"
                    >
                      {isConnecting ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : isConnected ? (
                        <PhoneOff className="h-6 w-6" />
                      ) : (
                        <Mic className="h-6 w-6" />
                      )}
                    </Button>

                    {isConnected && (
                      <div className="h-10 w-10 flex items-center justify-center">
                        {isSpeaking ? (
                          <div className="flex gap-1">
                            <div className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: "0ms" }} />
                            <div className="w-1 h-6 bg-primary rounded animate-pulse" style={{ animationDelay: "150ms" }} />
                            <div className="w-1 h-3 bg-primary rounded animate-pulse" style={{ animationDelay: "300ms" }} />
                          </div>
                        ) : (
                          <MicOff className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Powered by ElevenLabs
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Inline variant
  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${isConnected ? (isSpeaking ? "bg-green-500 animate-pulse" : "bg-green-500") : "bg-gray-400"}`} />
          Asistent Vocal AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {isConnecting ? "Se conectează..." : isConnected ? (isSpeaking ? "Agentul vorbește..." : "Te ascult...") : "Apasă pentru a vorbi cu asistentul AI"}
        </div>

        {transcript.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 max-h-40 overflow-y-auto text-sm space-y-1">
            {transcript.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={isConnected ? stopConversation : startConversation}
            disabled={isConnecting}
            variant={isConnected ? "destructive" : "default"}
            className="flex-1"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Conectare...
              </>
            ) : isConnected ? (
              <>
                <PhoneOff className="h-4 w-4 mr-2" />
                Închide conversația
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Începe conversația
              </>
            )}
          </Button>

          {isConnected && (
            <Button variant="outline" size="icon" onClick={toggleMute}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
