import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isYesterday } from "date-fns";
import { ro } from "date-fns/locale";
import { motion } from "framer-motion";
import { 
  Inbox,
  RefreshCw,
  Loader2,
  PenSquare,
  Reply,
  Send,
  Save,
  Paperclip,
  Star,
  Mail,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { InboxSidebar, EmailListItem, EmailDetail } from "@/components/inbox";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyTo, setReplyTo] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  
  // Compose state
  const [composeDialogOpen, setComposeDialogOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeAttachments, setComposeAttachments] = useState<File[]>([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [showDrafts, setShowDrafts] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch drafts
  const { data: drafts, refetch: refetchDrafts } = useQuery({
    queryKey: ['email-drafts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('email_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (draft: {
      id?: string;
      recipient: string;
      cc: string;
      bcc: string;
      subject: string;
      body: string;
      attachments: any[];
      silent?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nu ești autentificat');

      if (draft.id) {
        const { error } = await supabase
          .from('email_drafts')
          .update({
            recipient: draft.recipient,
            cc: draft.cc,
            bcc: draft.bcc,
            subject: draft.subject,
            body: draft.body,
            attachments: draft.attachments,
            updated_at: new Date().toISOString()
          })
          .eq('id', draft.id);
        if (error) throw error;
        return { id: draft.id, silent: draft.silent };
      } else {
        const { data, error } = await supabase
          .from('email_drafts')
          .insert({
            user_id: user.id,
            recipient: draft.recipient,
            cc: draft.cc,
            bcc: draft.bcc,
            subject: draft.subject,
            body: draft.body,
            attachments: draft.attachments
          })
          .select('id')
          .single();
        if (error) throw error;
        return { id: data.id, silent: draft.silent };
      }
    },
    onSuccess: (result) => {
      setCurrentDraftId(result.id);
      setLastAutoSave(new Date());
      queryClient.invalidateQueries({ queryKey: ['email-drafts'] });
      if (!result.silent) {
        toast.success('Ciornă salvată');
      }
    },
    onError: (error: any) => {
      toast.error(`Eroare la salvare: ${error.message}`);
    }
  });

  const performAutoSave = useCallback(async () => {
    if (!composeTo && !composeSubject && !composeBody) return;
    
    saveDraftMutation.mutate({
      id: currentDraftId || undefined,
      recipient: composeTo,
      cc: composeCc,
      bcc: composeBcc,
      subject: composeSubject,
      body: composeBody,
      attachments: [],
      silent: true
    });
  }, [composeTo, composeCc, composeBcc, composeSubject, composeBody, currentDraftId]);

  useEffect(() => {
    if (composeDialogOpen) {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      
      autoSaveIntervalRef.current = setInterval(() => {
        performAutoSave();
      }, 30000);
      
      return () => {
        if (autoSaveIntervalRef.current) {
          clearInterval(autoSaveIntervalRef.current);
        }
      };
    } else {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
    }
  }, [composeDialogOpen, performAutoSave]);

  const deleteDraftMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_drafts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-drafts'] });
      toast.success('Ciornă ștearsă');
    }
  });

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
      resetComposeForm();
    },
    onError: (error: any) => {
      toast.error(`Eroare la trimitere: ${error.message}`);
    }
  });

  const resetComposeForm = () => {
    setComposeTo("");
    setComposeCc("");
    setComposeBcc("");
    setComposeSubject("");
    setComposeBody("");
    setComposeAttachments([]);
    setShowCcBcc(false);
    setCurrentDraftId(null);
  };

  const handleSelectEmail = async (email: ReceivedEmail) => {
    setSelectedEmail(email);
    setMobileView('detail');
    if (!email.is_read) {
      updateEmailMutation.mutate({ id: email.id, updates: { is_read: true } });
    }
  };

  const handleBackToList = () => {
    setMobileView('list');
    setSelectedEmail(null);
  };

  const handleToggleStar = (e: React.MouseEvent, email: ReceivedEmail) => {
    e.stopPropagation();
    updateEmailMutation.mutate({ 
      id: email.id, 
      updates: { is_starred: !email.is_starred } 
    });
  };

  const handleArchive = () => {
    if (!selectedEmail) return;
    updateEmailMutation.mutate({ 
      id: selectedEmail.id, 
      updates: { is_archived: true } 
    });
    setSelectedEmail(null);
    toast.success('Email arhivat');
  };

  const handleDelete = () => {
    if (!selectedEmail) return;
    deleteEmailMutation.mutate(selectedEmail.id);
  };

  const handleOpenReply = () => {
    if (!selectedEmail) return;
    const emailMatch = selectedEmail.sender.match(/<([^>]+)>/) || [null, selectedEmail.sender];
    const senderEmail = emailMatch[1] || selectedEmail.sender;
    
    setReplyTo(senderEmail);
    setReplySubject(selectedEmail.subject?.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject || ''}`);
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
    resetComposeForm();
    setComposeDialogOpen(true);
  };

  const handleSaveDraft = async () => {
    const attachmentsData = await Promise.all(
      composeAttachments.map(async (file) => ({
        filename: file.name,
        content: await fileToBase64(file),
        contentType: file.type || 'application/octet-stream'
      }))
    );

    saveDraftMutation.mutate({
      id: currentDraftId || undefined,
      recipient: composeTo,
      cc: composeCc,
      bcc: composeBcc,
      subject: composeSubject,
      body: composeBody,
      attachments: attachmentsData
    });
  };

  const handleLoadDraft = (draft: any) => {
    setComposeTo(draft.recipient || "");
    setComposeCc(draft.cc || "");
    setComposeBcc(draft.bcc || "");
    setComposeSubject(draft.subject || "");
    setComposeBody(draft.body || "");
    setComposeAttachments([]);
    setCurrentDraftId(draft.id);
    setShowCcBcc(!!(draft.cc || draft.bcc));
    setShowDrafts(false);
    setComposeDialogOpen(true);
  };

  const handleDeleteDraft = (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation();
    deleteDraftMutation.mutate(draftId);
    if (currentDraftId === draftId) {
      setCurrentDraftId(null);
    }
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

  const extractSenderInitials = (sender: string) => {
    const name = extractSenderName(sender);
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatEmailDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    }
    if (isYesterday(date)) {
      return 'Ieri';
    }
    return format(date, 'dd MMM', { locale: ro });
  };

  const unreadCount = emails?.filter(e => !e.is_read).length || 0;
  const starredCount = emails?.filter(e => e.is_starred).length || 0;

  const filteredEmails = emails?.filter(email => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      email.sender.toLowerCase().includes(query) ||
      email.subject?.toLowerCase().includes(query) ||
      email.body_plain?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-2 md:gap-4">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-4",
          mobileView === 'detail' && "hidden md:flex"
        )}
      >
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/40 to-gold/10 rounded-xl md:rounded-2xl blur-xl" />
            <div className="relative p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
              <Inbox className="h-5 w-5 md:h-6 md:w-6 text-gold" />
            </div>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Inbox</h1>
            <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
              {unreadCount > 0 && (
                <span className="flex items-center gap-1 md:gap-1.5">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gold animate-pulse" />
                  {unreadCount} necitite
                </span>
              )}
              {starredCount > 0 && (
                <span className="flex items-center gap-1 md:gap-1.5">
                  <Star className="h-3 w-3 text-yellow-500" />
                  {starredCount} cu stea
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            onClick={handleOpenCompose}
            size="sm"
            className="bg-gradient-to-r from-gold to-gold-light text-black hover:shadow-lg hover:shadow-gold/25 transition-all flex-1 sm:flex-none"
          >
            <PenSquare className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">Compune</span>
            <span className="xs:hidden">Nou</span>
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            className="border-white/10 hover:bg-white/5 h-8 w-8 md:h-10 md:w-10"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </motion.div>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-2 md:gap-4 min-h-0 overflow-hidden">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block shrink-0">
          <InboxSidebar
            filter={filter}
            setFilter={setFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            emailsCount={emails?.length || 0}
            unreadCount={unreadCount}
            starredCount={starredCount}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            showDrafts={showDrafts}
            setShowDrafts={setShowDrafts}
            drafts={drafts}
            onLoadDraft={handleLoadDraft}
            onDeleteDraft={handleDeleteDraft}
          />
        </div>

        {/* Mobile Filter Bar - Only show in list view on mobile */}
        {mobileView === 'list' && (
          <div className="lg:hidden flex items-center gap-2 shrink-0">
            {['all', 'unread', 'starred'].map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setFilter(filterKey as 'all' | 'unread' | 'starred')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  filter === filterKey 
                    ? "bg-gold/20 text-gold border border-gold/30" 
                    : "bg-white/5 text-muted-foreground border border-white/10"
                )}
              >
                {filterKey === 'all' && <Mail className="h-3 w-3" />}
                {filterKey === 'unread' && unreadCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-gold text-black text-[10px] flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
                {filterKey === 'starred' && <Star className="h-3 w-3" />}
                <span>
                  {filterKey === 'all' ? 'Toate' : filterKey === 'unread' ? 'Necitite' : 'Cu stea'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Email List - Full width on mobile when list view */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl md:rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden flex flex-col",
            "flex-1 lg:w-80 lg:flex-none lg:shrink-0",
            mobileView === 'detail' && "hidden lg:flex"
          )}
        >
          <div className="p-2 md:p-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              {filteredEmails?.length || 0} email-uri
            </span>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="text-xs text-gold hover:underline"
              >
                Șterge căutarea
              </button>
            )}
          </div>
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-6 md:p-8 text-center">
                <Loader2 className="h-6 w-6 md:h-8 md:w-8 mx-auto animate-spin text-gold/50" />
                <p className="text-xs md:text-sm text-muted-foreground mt-2 md:mt-3">Se încarcă...</p>
              </div>
            ) : filteredEmails?.length === 0 ? (
              <div className="p-6 md:p-8 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Mail className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground/30" />
                </div>
                <p className="font-medium text-sm md:text-base text-muted-foreground">Nu există email-uri</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {searchQuery ? "Încearcă altă căutare" : "Inbox-ul tău este gol"}
                </p>
              </div>
            ) : (
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.03 } }
                }}
                className="divide-y divide-white/5"
              >
                {filteredEmails?.map((email) => (
                  <EmailListItem
                    key={email.id}
                    email={email}
                    isSelected={selectedEmail?.id === email.id}
                    onSelect={() => handleSelectEmail(email)}
                    onToggleStar={(e) => handleToggleStar(e, email)}
                    extractSenderName={extractSenderName}
                    extractSenderInitials={extractSenderInitials}
                    formatEmailDate={formatEmailDate}
                  />
                ))}
              </motion.div>
            )}
          </ScrollArea>
        </motion.div>

        {/* Email Detail - Full width on mobile when detail view */}
        <div className={cn(
          "flex-1 min-w-0 min-h-0",
          mobileView === 'list' && "hidden lg:block"
        )}>
          <EmailDetail
            email={selectedEmail}
            onClose={handleBackToList}
            onReply={handleOpenReply}
            onToggleStar={() => {
              if (selectedEmail) {
                updateEmailMutation.mutate({ 
                  id: selectedEmail.id, 
                  updates: { is_starred: !selectedEmail.is_starred } 
                });
              }
            }}
            onArchive={handleArchive}
            onDelete={handleDelete}
            extractSenderName={extractSenderName}
            extractSenderInitials={extractSenderInitials}
          />
        </div>
      </div>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5 text-gold" />
              Răspunde la email
            </DialogTitle>
            <DialogDescription>Trimite un răspuns către expeditor</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Către</Label>
              <Input
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="email@example.com"
                className="bg-white/5 border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Subiect</Label>
              <Input
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                placeholder="Re: Subiect"
                className="bg-white/5 border-white/10"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Mesaj</Label>
              <Textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Scrie răspunsul tău aici..."
                className="min-h-[200px] bg-white/5 border-white/10"
              />
            </div>
            
            {selectedEmail && (
              <div className="p-3 bg-white/5 rounded-xl text-sm border border-white/10">
                <p className="font-medium text-muted-foreground mb-1">Email original:</p>
                <p className="text-xs text-muted-foreground">
                  De la: {selectedEmail.sender}<br/>
                  Subiect: {selectedEmail.subject}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)} className="border-white/10">
              Anulează
            </Button>
            <Button 
              onClick={handleSendReply}
              disabled={sendReplyMutation.isPending || !replyBody.trim()}
              className="bg-gradient-to-r from-gold to-gold-light text-black"
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

      {/* Compose Dialog */}
      <Dialog open={composeDialogOpen} onOpenChange={setComposeDialogOpen}>
        <DialogContent className="max-w-2xl bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenSquare className="h-5 w-5 text-gold" />
              Email nou
            </DialogTitle>
            <DialogDescription className="flex items-center justify-between">
              <span>Compune și trimite un email nou</span>
              {lastAutoSave && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500" />
                  Salvat la {format(lastAutoSave, 'HH:mm:ss')}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Către</Label>
                {!showCcBcc && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-6 text-gold"
                    onClick={() => setShowCcBcc(true)}
                  >
                    CC/BCC
                  </Button>
                )}
              </div>
              <Input
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                placeholder="email@example.com"
                className="bg-white/5 border-white/10"
              />
            </div>
            
            {showCcBcc && (
              <>
                <div className="space-y-2">
                  <Label>CC</Label>
                  <Input
                    value={composeCc}
                    onChange={(e) => setComposeCc(e.target.value)}
                    placeholder="cc@example.com"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>BCC</Label>
                  <Input
                    value={composeBcc}
                    onChange={(e) => setComposeBcc(e.target.value)}
                    placeholder="bcc@example.com"
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label>Subiect</Label>
              <Input
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Subiectul emailului"
                className="bg-white/5 border-white/10"
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

            <div className="space-y-2">
              <Label>Atașamente</Label>
              <Input
                type="file"
                multiple
                onChange={handleFileChange}
                className="bg-white/5 border-white/10"
              />
              {composeAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {composeAttachments.map((file, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="flex items-center gap-1 py-1 px-2 bg-white/5"
                    >
                      <Paperclip className="h-3 w-3" />
                      {file.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setComposeDialogOpen(false)} className="border-white/10">
                Anulează
              </Button>
              <Button 
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={saveDraftMutation.isPending}
                className="bg-white/5 hover:bg-white/10"
              >
                {saveDraftMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvează
                  </>
                )}
              </Button>
            </div>
            <Button 
              onClick={async () => {
                await handleSendEmail();
                if (currentDraftId) {
                  deleteDraftMutation.mutate(currentDraftId);
                  setCurrentDraftId(null);
                }
              }}
              disabled={sendEmailMutation.isPending || !composeBody.trim() || !composeTo.trim()}
              className="bg-gradient-to-r from-gold to-gold-light text-black"
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
