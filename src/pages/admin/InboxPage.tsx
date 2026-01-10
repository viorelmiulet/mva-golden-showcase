import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { 
  Mail, 
  MailOpen, 
  Star, 
  StarOff, 
  Trash2, 
  Archive, 
  RefreshCw,
  Inbox,
  ChevronLeft,
  Paperclip,
  Reply,
  Send,
  Loader2,
  PenSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import RichTextEditor from "@/components/RichTextEditor";

interface ReceivedEmail {
  id: string;
  sender: string;
  recipient: string | null;
  subject: string | null;
  body_plain: string | null;
  body_html: string | null;
  stripped_text: string | null;
  message_id: string | null;
  attachments: any[];
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  received_at: string;
  created_at: string;
}

const InboxPage = () => {
  const [selectedEmail, setSelectedEmail] = useState<ReceivedEmail | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyTo, setReplyTo] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  
  // Compose new email state
  const [composeDialogOpen, setComposeDialogOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeAttachments, setComposeAttachments] = useState<File[]>([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: emails, isLoading, refetch } = useQuery({
    queryKey: ['received-emails', filter],
    queryFn: async () => {
      let query = supabase
        .from('received_emails')
        .select('*')
        .eq('is_archived', false)
        .order('received_at', { ascending: false });

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      } else if (filter === 'starred') {
        query = query.eq('is_starred', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ReceivedEmail[];
    }
  });

  const updateEmailMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ReceivedEmail> }) => {
      const { error } = await supabase
        .from('received_emails')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-emails'] });
    }
  });

  const deleteEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('received_emails')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-emails'] });
      setSelectedEmail(null);
      toast.success('Email șters');
    }
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ to, subject, body, inReplyTo }: { 
      to: string; 
      subject: string; 
      body: string; 
      inReplyTo?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('reply-email', {
        body: { to, subject, body, inReplyTo }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Răspunsul a fost trimis!');
      setReplyDialogOpen(false);
      setReplyBody("");
    },
    onError: (error: any) => {
      toast.error(`Eroare la trimitere: ${error.message}`);
    }
  });

  // Compose new email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ to, cc, bcc, subject, body, attachments }: { 
      to: string;
      cc?: string;
      bcc?: string;
      subject: string; 
      body: string;
      attachments: Array<{ filename: string; content: string; contentType: string }>;
    }) => {
      const { data, error } = await supabase.functions.invoke('reply-email', {
        body: { to, cc, bcc, subject, body, attachments }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Email-ul a fost trimis!');
      setComposeDialogOpen(false);
      setComposeTo("");
      setComposeCc("");
      setComposeBcc("");
      setComposeSubject("");
      setComposeBody("");
      setComposeAttachments([]);
      setShowCcBcc(false);
    },
    onError: (error: any) => {
      toast.error(`Eroare la trimitere: ${error.message}`);
    }
  });

  const handleSelectEmail = async (email: ReceivedEmail) => {
    setSelectedEmail(email);
    if (!email.is_read) {
      updateEmailMutation.mutate({ id: email.id, updates: { is_read: true } });
    }
  };

  const handleToggleStar = (e: React.MouseEvent, email: ReceivedEmail) => {
    e.stopPropagation();
    updateEmailMutation.mutate({ 
      id: email.id, 
      updates: { is_starred: !email.is_starred } 
    });
  };

  const handleArchive = (email: ReceivedEmail) => {
    updateEmailMutation.mutate({ 
      id: email.id, 
      updates: { is_archived: true } 
    });
    setSelectedEmail(null);
    toast.success('Email arhivat');
  };

  const handleDelete = (email: ReceivedEmail) => {
    deleteEmailMutation.mutate(email.id);
  };

  const handleOpenReply = (email: ReceivedEmail) => {
    // Extract email address from sender (could be "Name <email@domain.com>" format)
    const emailMatch = email.sender.match(/<([^>]+)>/) || [null, email.sender];
    const senderEmail = emailMatch[1] || email.sender;
    
    setReplyTo(senderEmail);
    setReplySubject(email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject || ''}`);
    setReplyBody("");
    setReplyDialogOpen(true);
  };

  const handleSendReply = () => {
    if (!replyTo || !replyBody.trim()) {
      toast.error('Completează destinatarul și mesajul');
      return;
    }
    
    sendReplyMutation.mutate({
      to: replyTo,
      subject: replySubject,
      body: replyBody,
      inReplyTo: selectedEmail?.message_id || undefined
    });
  };

  const handleOpenCompose = () => {
    setComposeTo("");
    setComposeCc("");
    setComposeBcc("");
    setComposeSubject("");
    setComposeBody("");
    setComposeAttachments([]);
    setShowCcBcc(false);
    setComposeDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setComposeAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setComposeAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:mime/type;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSendEmail = async () => {
    if (!composeTo || !composeBody.trim()) {
      toast.error('Completează destinatarul și mesajul');
      return;
    }
    
    // Convert files to base64
    const attachmentsData = await Promise.all(
      composeAttachments.map(async (file) => ({
        filename: file.name,
        content: await fileToBase64(file),
        contentType: file.type || 'application/octet-stream'
      }))
    );

    sendEmailMutation.mutate({
      to: composeTo,
      cc: composeCc || undefined,
      bcc: composeBcc || undefined,
      subject: composeSubject,
      body: composeBody,
      attachments: attachmentsData
    });
  };

  const extractSenderName = (sender: string) => {
    const match = sender.match(/^([^<]+)/);
    return match ? match[1].trim() : sender.split('@')[0];
  };

  const unreadCount = emails?.filter(e => !e.is_read).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Inbox className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Inbox</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} email-uri necitite` : 'Toate email-urile citite'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleOpenCompose}>
            <PenSquare className="h-4 w-4 mr-2" />
            Compune
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reîncarcă
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('all')}
        >
          Toate
        </Button>
        <Button 
          variant={filter === 'unread' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Necitite
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">{unreadCount}</Badge>
          )}
        </Button>
        <Button 
          variant={filter === 'starred' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('starred')}
        >
          Cu stea
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email List */}
        <Card className="lg:col-span-1">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {emails?.length || 0} email-uri
            </CardTitle>
          </CardHeader>
          <ScrollArea className="h-[600px]">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Se încarcă...
                </div>
              ) : emails?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nu există email-uri</p>
                </div>
              ) : (
                emails?.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    className={cn(
                      "p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b",
                      selectedEmail?.id === email.id && "bg-muted",
                      !email.is_read && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => handleToggleStar(e, email)}
                        className="mt-1 text-muted-foreground hover:text-yellow-500 transition-colors"
                      >
                        {email.is_starred ? (
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {!email.is_read ? (
                            <Mail className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <MailOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span className={cn(
                            "font-medium truncate",
                            !email.is_read && "font-semibold"
                          )}>
                            {extractSenderName(email.sender)}
                          </span>
                        </div>
                        <p className={cn(
                          "text-sm truncate mt-1",
                          !email.is_read ? "font-medium" : "text-muted-foreground"
                        )}>
                          {email.subject || '(Fără subiect)'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(email.received_at), 'dd MMM, HH:mm', { locale: ro })}
                          </span>
                          {email.attachments && email.attachments.length > 0 && (
                            <Paperclip className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        {/* Email Detail */}
        <Card className="lg:col-span-2">
          {selectedEmail ? (
            <>
              <CardHeader className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="lg:hidden"
                      onClick={() => setSelectedEmail(null)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <CardTitle className="text-lg">
                        {selectedEmail.subject || '(Fără subiect)'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        De la: {selectedEmail.sender}
                      </p>
                      {selectedEmail.recipient && (
                        <p className="text-sm text-muted-foreground">
                          Către: {selectedEmail.recipient}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground hidden sm:inline">
                      {format(new Date(selectedEmail.received_at), 'dd MMMM yyyy, HH:mm', { locale: ro })}
                    </span>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenReply(selectedEmail)}
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Răspunde
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStar({ stopPropagation: () => {} } as any, selectedEmail)}
                    >
                      {selectedEmail.is_starred ? (
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleArchive(selectedEmail)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(selectedEmail)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="py-4">
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Atașamente ({selectedEmail.attachments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmail.attachments.map((att: any, idx: number) => (
                        att.url ? (
                          <a 
                            key={idx} 
                            href={att.url} 
                            download={att.name}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-sm transition-colors"
                          >
                            <Paperclip className="h-3 w-3" />
                            📥 {att.name} ({Math.round(att.size / 1024)} KB)
                          </a>
                        ) : (
                          <Badge key={idx} variant="secondary" className="opacity-60">
                            {att.name} ({Math.round(att.size / 1024)} KB) - nedisponibil
                          </Badge>
                        )
                      ))}
                    </div>
                  </div>
                )}
                <ScrollArea className="h-[400px]">
                  {selectedEmail.body_html ? (
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {selectedEmail.body_plain || selectedEmail.stripped_text || 'Nu există conținut'}
                    </pre>
                  )}
                </ScrollArea>
              </CardContent>
            </>
          ) : (
            <div className="h-[600px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Mail className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>Selectează un email pentru a-l vizualiza</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Mailgun Webhook Instructions */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Configurare Mailgun Routes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Pentru a primi email-uri, configurează un Route în Mailgun:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Mergi la Mailgun → Sending → Routes</li>
            <li>Click "Create route"</li>
            <li>Expression Type: <code className="bg-background px-1 rounded">catch_all()</code></li>
            <li>Actions → Forward → Store and notify:</li>
          </ol>
          <code className="block p-2 bg-background rounded text-xs break-all">
            https://fdpandnzblzvamhsoukt.supabase.co/functions/v1/receive-mailgun-email
          </code>
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5" />
              Răspunde la email
            </DialogTitle>
            <DialogDescription>
              Trimite un răspuns către expeditor
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reply-to">Către</Label>
              <Input
                id="reply-to"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reply-subject">Subiect</Label>
              <Input
                id="reply-subject"
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                placeholder="Re: Subiect"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reply-body">Mesaj</Label>
              <Textarea
                id="reply-body"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Scrie răspunsul tău aici..."
                className="min-h-[200px]"
              />
            </div>
            
            {selectedEmail && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium text-muted-foreground mb-2">Email original:</p>
                <p className="text-xs text-muted-foreground">
                  De la: {selectedEmail.sender}<br/>
                  Subiect: {selectedEmail.subject}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
              Anulează
            </Button>
            <Button 
              onClick={handleSendReply}
              disabled={sendReplyMutation.isPending || !replyBody.trim()}
            >
              {sendReplyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se trimite...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Trimite
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compose New Email Dialog */}
      <Dialog open={composeDialogOpen} onOpenChange={setComposeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenSquare className="h-5 w-5" />
              Email nou
            </DialogTitle>
            <DialogDescription>
              Compune și trimite un email nou
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="compose-to">Către</Label>
                {!showCcBcc && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-6"
                    onClick={() => setShowCcBcc(true)}
                  >
                    CC/BCC
                  </Button>
                )}
              </div>
              <Input
                id="compose-to"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            
            {showCcBcc && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="compose-cc">CC</Label>
                  <Input
                    id="compose-cc"
                    value={composeCc}
                    onChange={(e) => setComposeCc(e.target.value)}
                    placeholder="cc@example.com (separă cu virgulă pentru mai mulți)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="compose-bcc">BCC</Label>
                  <Input
                    id="compose-bcc"
                    value={composeBcc}
                    onChange={(e) => setComposeBcc(e.target.value)}
                    placeholder="bcc@example.com (separă cu virgulă pentru mai mulți)"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="compose-subject">Subiect</Label>
              <Input
                id="compose-subject"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Subiectul emailului"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Mesaj</Label>
              <RichTextEditor
                value={composeBody}
                onChange={setComposeBody}
                placeholder="Scrie mesajul tău aici..."
              />
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <Label>Atașamente</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="flex-1"
                />
              </div>
              {composeAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {composeAttachments.map((file, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="flex items-center gap-1 py-1 px-2"
                    >
                      <Paperclip className="h-3 w-3" />
                      {file.name} ({Math.round(file.size / 1024)} KB)
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeDialogOpen(false)}>
              Anulează
            </Button>
            <Button 
              onClick={handleSendEmail}
              disabled={sendEmailMutation.isPending || !composeBody.trim() || !composeTo.trim()}
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se trimite...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Trimite
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InboxPage;
