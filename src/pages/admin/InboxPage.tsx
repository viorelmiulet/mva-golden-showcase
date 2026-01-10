import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isYesterday } from "date-fns";
import { ro } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Star, 
  StarOff, 
  Trash2, 
  Archive, 
  RefreshCw,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Reply,
  Send,
  Loader2,
  PenSquare,
  FileText,
  Save,
  Search,
  MoreHorizontal,
  Clock,
  Check,
  X,
  Download,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [searchQuery, setSearchQuery] = useState("");
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
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [showDrafts, setShowDrafts] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
  };

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
    resetComposeForm();
    setCurrentDraftId(null);
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
      {/* Top Bar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/40 to-gold/10 rounded-2xl blur-xl" />
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
              <Inbox className="h-6 w-6 text-gold" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {unreadCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                  {unreadCount} necitite
                </span>
              )}
              {starredCount > 0 && (
                <span className="flex items-center gap-1.5">
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
            className="bg-gradient-to-r from-gold to-gold-light text-black hover:shadow-lg hover:shadow-gold/25 transition-all"
          >
            <PenSquare className="h-4 w-4 mr-2" />
            Compune
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            className="border-white/10 hover:bg-white/5"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0, width: sidebarCollapsed ? 48 : 'auto' }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex flex-col gap-4 transition-all",
            sidebarCollapsed ? "lg:col-span-1" : "lg:col-span-3"
          )}
        >
          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "border border-white/10 hover:bg-white/5 hover:border-gold/30",
              sidebarCollapsed ? "w-10 h-10 p-0 mx-auto" : "w-full justify-start gap-2"
            )}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span className="text-sm">Restrânge</span>
              </>
            )}
          </Button>

          {/* Search - hidden when collapsed */}
          {!sidebarCollapsed && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Caută email-uri..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 focus:border-gold/50"
              />
            </div>
          )}

          {/* Filter Tabs */}
          <div className={cn(
            "flex flex-col gap-1 p-1 rounded-xl bg-white/5 border border-white/10",
            sidebarCollapsed && "p-0.5"
          )}>
            {[
              { key: 'all', label: 'Toate', count: emails?.length || 0, icon: Mail },
              { key: 'unread', label: 'Necitite', count: unreadCount, icon: Clock },
              { key: 'starred', label: 'Cu stea', count: starredCount, icon: Star }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as typeof filter)}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-all",
                  sidebarCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5",
                  filter === item.key 
                    ? "bg-gradient-to-r from-gold/20 to-gold/5 text-gold border-l-2 border-gold" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {sidebarCollapsed ? (
                  <div className="relative">
                    <item.icon className="h-4 w-4" />
                    {item.count > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-gold text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                        {item.count > 9 ? '9+' : item.count}
                      </span>
                    )}
                  </div>
                ) : (
                  <>
                    <span className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {item.count > 0 && (
                      <Badge variant="secondary" className={cn(
                        "text-xs",
                        filter === item.key ? "bg-gold/20 text-gold" : "bg-white/10"
                      )}>
                        {item.count}
                      </Badge>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Drafts */}
          <button
            onClick={() => !sidebarCollapsed && setShowDrafts(!showDrafts)}
            className={cn(
              "flex items-center rounded-xl text-sm font-medium transition-all border",
              sidebarCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5",
              showDrafts && !sidebarCollapsed
                ? "bg-gold/10 border-gold/30 text-gold" 
                : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
            )}
            title={sidebarCollapsed ? "Ciorne" : undefined}
          >
            {sidebarCollapsed ? (
              <div className="relative">
                <FileText className="h-4 w-4" />
                {drafts && drafts.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white/20 text-[9px] font-bold rounded-full flex items-center justify-center">
                    {drafts.length}
                  </span>
                )}
              </div>
            ) : (
              <>
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Ciorne
                </span>
                {drafts && drafts.length > 0 && (
                  <Badge variant="secondary" className="bg-white/10 text-xs">
                    {drafts.length}
                  </Badge>
                )}
              </>
            )}
          </button>

          {/* Drafts List - hidden when collapsed */}
          <AnimatePresence>
            {showDrafts && !sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                  {!drafts || drafts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nu ai ciorne salvate
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {drafts.map((draft) => (
                        <div
                          key={draft.id}
                          onClick={() => handleLoadDraft(draft)}
                          className="p-3 cursor-pointer hover:bg-white/5 transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate group-hover:text-gold transition-colors">
                                {draft.subject || '(Fără subiect)'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {draft.recipient || '(niciun destinatar)'}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                              onClick={(e) => handleDeleteDraft(e, draft.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Email List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden flex flex-col",
            sidebarCollapsed ? "lg:col-span-5" : "lg:col-span-4"
          )}
        >
          <div className="p-3 border-b border-white/5 flex items-center justify-between">
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
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-gold/50" />
                <p className="text-sm text-muted-foreground mt-3">Se încarcă...</p>
              </div>
            ) : filteredEmails?.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="font-medium text-muted-foreground">Nu există email-uri</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {searchQuery ? "Încearcă altă căutare" : "Inbox-ul tău este gol"}
                </p>
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="divide-y divide-white/5"
              >
                {filteredEmails?.map((email) => (
                  <motion.div
                    key={email.id}
                    variants={itemVariants}
                    onClick={() => handleSelectEmail(email)}
                    className={cn(
                      "p-3 cursor-pointer transition-all relative group",
                      selectedEmail?.id === email.id 
                        ? "bg-gradient-to-r from-gold/10 to-transparent" 
                        : "hover:bg-white/[0.03]",
                      !email.is_read && "bg-white/[0.02]"
                    )}
                  >
                    {/* Selection indicator */}
                    {selectedEmail?.id === email.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gold" />
                    )}
                    
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
                        !email.is_read 
                          ? "bg-gradient-to-br from-gold/30 to-gold/10 text-gold" 
                          : "bg-white/10 text-muted-foreground"
                      )}>
                        {extractSenderInitials(email.sender)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn(
                            "font-medium text-sm truncate",
                            !email.is_read ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {extractSenderName(email.sender)}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatEmailDate(email.received_at)}
                          </span>
                        </div>
                        
                        <p className={cn(
                          "text-sm truncate mt-0.5",
                          !email.is_read ? "text-foreground/80 font-medium" : "text-muted-foreground"
                        )}>
                          {email.subject || '(Fără subiect)'}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-1.5">
                          {!email.is_read && (
                            <div className="w-2 h-2 rounded-full bg-gold" />
                          )}
                          {email.is_starred && (
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          )}
                          {email.attachments && email.attachments.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Paperclip className="h-3 w-3" />
                              {email.attachments.length}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Quick star action */}
                      <button
                        onClick={(e) => handleToggleStar(e, email)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded-lg"
                      >
                        {email.is_starred ? (
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        ) : (
                          <StarOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </ScrollArea>
        </motion.div>

        {/* Email Detail */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden flex flex-col"
        >
          <AnimatePresence mode="wait">
            {selectedEmail ? (
              <motion.div
                key={selectedEmail.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full"
              >
                {/* Header */}
                <div className="p-4 border-b border-white/5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="lg:hidden shrink-0 h-8 w-8"
                        onClick={() => setSelectedEmail(null)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center text-gold font-semibold shrink-0">
                        {extractSenderInitials(selectedEmail.sender)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate text-lg">
                          {selectedEmail.subject || '(Fără subiect)'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {extractSenderName(selectedEmail.sender)}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {format(new Date(selectedEmail.received_at), 'EEEE, dd MMMM yyyy, HH:mm', { locale: ro })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleOpenReply(selectedEmail)}
                        className="bg-gradient-to-r from-gold to-gold-light text-black"
                      >
                        <Reply className="h-4 w-4 mr-1" />
                        Răspunde
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-white/10">
                          <DropdownMenuItem onClick={() => handleToggleStar({ stopPropagation: () => {} } as any, selectedEmail)}>
                            {selectedEmail.is_starred ? (
                              <>
                                <StarOff className="h-4 w-4 mr-2" />
                                Elimină steaua
                              </>
                            ) : (
                              <>
                                <Star className="h-4 w-4 mr-2" />
                                Adaugă stea
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchive(selectedEmail)}>
                            <Archive className="h-4 w-4 mr-2" />
                            Arhivează
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(selectedEmail)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Șterge
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Attachments */}
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      {selectedEmail.attachments.map((att: any, idx: number) => (
                        att.url ? (
                          <a 
                            key={idx} 
                            href={att.url} 
                            download={att.name}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gold/10 hover:bg-gold/20 text-gold rounded-lg text-xs transition-colors border border-gold/20"
                          >
                            <Download className="h-3 w-3" />
                            {att.name}
                          </a>
                        ) : (
                          <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 text-muted-foreground rounded-lg text-xs">
                            {att.name} - nedisponibil
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Body */}
                <ScrollArea className="flex-1 p-4">
                  {selectedEmail.body_html ? (
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/80 prose-a:text-gold"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/80 leading-relaxed">
                      {selectedEmail.body_plain || selectedEmail.stripped_text || 'Nu există conținut'}
                    </pre>
                  )}
                </ScrollArea>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-br from-gold/30 to-gold/5 rounded-3xl blur-2xl" />
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mx-auto border border-white/10">
                      <Mail className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  </div>
                  <p className="mt-4 font-medium text-muted-foreground">Selectează un email</p>
                  <p className="text-sm text-muted-foreground/60">pentru a-l vizualiza</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
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
                        ×
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
