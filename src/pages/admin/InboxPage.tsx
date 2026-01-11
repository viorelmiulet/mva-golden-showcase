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
  X,
  Archive,
  FileText
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RichTextEditor from "@/components/RichTextEditor";
import { InboxSidebar, EmailListItem, EmailDetail, SwipeableEmailItem, EmailAutocomplete } from "@/components/inbox";
import EmailListSkeleton from "@/components/skeletons/EmailListSkeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/admin/PullToRefreshIndicator";

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
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'archived' | 'sent'>('all');
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
  const [recipientFilter, setRecipientFilter] = useState<string>('all');
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  // Fetch email addresses from settings
  const { data: emailAddresses } = useQuery({
    queryKey: ['email-function-settings-addresses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_function_settings')
        .select('from_email, function_label')
        .eq('is_active', true);
      if (error) throw error;
      
      // Get unique emails
      const uniqueEmails = new Map<string, string>();
      data?.forEach(item => {
        if (!uniqueEmails.has(item.from_email)) {
          uniqueEmails.set(item.from_email, item.function_label);
        }
      });
      
      return Array.from(uniqueEmails.entries()).map(([email, label]) => ({
        email,
        label: `${label} (${email})`
      }));
    }
  });

  const { data: emails, isLoading, refetch } = useQuery({
    queryKey: ['received-emails', filter, recipientFilter],
    queryFn: async () => {
      console.log('[InboxPage] Fetching emails with filter:', filter, 'recipientFilter:', recipientFilter);
      
      // If filter is 'sent', query sent_emails table instead
      if (filter === 'sent') {
        const { data, error } = await supabase
          .from('sent_emails')
          .select('*')
          .order('sent_at', { ascending: false });
        if (error) {
          console.error('[InboxPage] Error fetching sent emails:', error);
          throw error;
        }
        console.log('[InboxPage] Fetched sent emails:', data?.length);
        
        // Map sent_emails to ReceivedEmail format for display
        return (data || []).map((email: any) => ({
          id: email.id,
          sender: email.from_address,
          recipient: email.recipient,
          subject: email.subject,
          body_plain: email.body_plain,
          body_html: email.body_html,
          stripped_text: email.body_plain,
          message_id: email.message_id,
          attachments: email.attachments || [],
          is_read: true,
          is_starred: false,
          is_archived: false,
          received_at: email.sent_at,
          created_at: email.created_at
        })) as ReceivedEmail[];
      }

      let query = supabase
        .from('received_emails')
        .select('*')
        .order('received_at', { ascending: false });

      if (filter === 'archived') {
        query = query.eq('is_archived', true);
      } else {
        query = query.eq('is_archived', false);
        if (filter === 'unread') {
          query = query.eq('is_read', false);
        } else if (filter === 'starred') {
          query = query.eq('is_starred', true);
        }
      }

      // Apply recipient filter
      if (recipientFilter && recipientFilter !== 'all') {
        query = query.ilike('recipient', `%${recipientFilter}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[InboxPage] Error fetching received emails:', error);
        throw error;
      }
      console.log('[InboxPage] Fetched received emails:', data?.length, data);
      return data as ReceivedEmail[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
    gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache
  });

  // Query for archived count
  const { data: archivedEmails } = useQuery({
    queryKey: ['received-emails-archived-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('received_emails')
        .select('id')
        .eq('is_archived', true);
      if (error) throw error;
      return data;
    }
  });

  // Query for sent emails count
  const { data: sentEmails } = useQuery({
    queryKey: ['sent-emails-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sent_emails')
        .select('id');
      if (error) throw error;
      return data;
    }
  });

  const archivedCount = archivedEmails?.length || 0;
  const sentCount = sentEmails?.length || 0;

  // Pull to refresh for mobile
  const pullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      await refetch();
      toast.success('Email-uri actualizate');
    },
    disabled: mobileView === 'detail'
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
      queryClient.invalidateQueries({ queryKey: ['unread-emails-count'] });
      queryClient.invalidateQueries({ queryKey: ['unread-emails-for-notifications'] });
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
      queryClient.invalidateQueries({ queryKey: ['unread-emails-count'] });
      queryClient.invalidateQueries({ queryKey: ['unread-emails-for-notifications'] });
      setSelectedEmail(null);
      toast.success('Email șters');
    }
  });

  const deleteSentEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sent_emails')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-emails'] });
      queryClient.invalidateQueries({ queryKey: ['sent-emails-count'] });
      setSelectedEmail(null);
      toast.success('Email trimis șters');
    }
  });

  const archiveEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('received_emails')
        .update({ is_archived: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-emails'] });
      queryClient.invalidateQueries({ queryKey: ['received-emails-archived-count'] });
      queryClient.invalidateQueries({ queryKey: ['unread-emails-for-notifications'] });
      setSelectedEmail(null);
      toast.success('Email arhivat');
    }
  });

  const unarchiveEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('received_emails')
        .update({ is_archived: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-emails'] });
      queryClient.invalidateQueries({ queryKey: ['received-emails-archived-count'] });
      queryClient.invalidateQueries({ queryKey: ['unread-emails-for-notifications'] });
      setSelectedEmail(null);
      toast.success('Email restaurat din arhivă');
    }
  });

  const isMobile = useIsMobile();

  const sendReplyMutation = useMutation({
    mutationFn: async ({ to, subject, body, inReplyTo, replyFromAddress }: { 
      to: string; 
      subject: string; 
      body: string; 
      inReplyTo?: string;
      replyFromAddress?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('reply-email', {
        body: { to, subject, body, inReplyTo, isReply: true, replyFromAddress }
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

  const saveEmailContactMutation = useMutation({
    mutationFn: async (email: string) => {
      // Extract just the email if format is "Name <email@domain.com>"
      const cleanEmail = email.includes('<') 
        ? email.match(/<(.+)>/)?.[1]?.toLowerCase() || email.toLowerCase()
        : email.toLowerCase();
      
      const { error } = await supabase
        .from('email_contacts')
        .upsert({ 
          email: cleanEmail,
          last_used_at: new Date().toISOString(),
          use_count: 1
        }, { 
          onConflict: 'email',
          ignoreDuplicates: false
        });
      
      if (error) {
        // If upsert fails, try to update the existing record
        await supabase
          .from('email_contacts')
          .update({ 
            last_used_at: new Date().toISOString()
          })
          .eq('email', cleanEmail);
      }
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
        body: { to, cc, bcc, subject, body, attachments, isReply: false }
      });
      if (error) throw error;
      
      // Save email contacts
      saveEmailContactMutation.mutate(to);
      if (cc) saveEmailContactMutation.mutate(cc);
      if (bcc) saveEmailContactMutation.mutate(bcc);
      
      return data;
    },
    onSuccess: () => {
      toast.success('Email-ul a fost trimis!');
      setComposeDialogOpen(false);
      resetComposeForm();
      queryClient.invalidateQueries({ queryKey: ['email-contacts'] });
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
    if (filter === 'sent') {
      deleteSentEmailMutation.mutate(selectedEmail.id);
    } else {
      deleteEmailMutation.mutate(selectedEmail.id);
    }
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
      inReplyTo: selectedEmail?.message_id || undefined,
      replyFromAddress: selectedEmail?.recipient || undefined
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

  console.log('[InboxPage] Render state - isMobile:', isMobile, 'mobileView:', mobileView, 'emails:', emails?.length, 'filteredEmails:', filteredEmails?.length, 'isLoading:', isLoading);

  return (
    <div className="h-[calc(100vh-180px)] md:h-[calc(100vh-120px)] flex flex-col gap-2 md:gap-4">
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
            archivedCount={archivedCount}
            sentCount={sentCount}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            showDrafts={showDrafts}
            setShowDrafts={setShowDrafts}
            drafts={drafts}
            onLoadDraft={handleLoadDraft}
            onDeleteDraft={handleDeleteDraft}
            recipientFilter={recipientFilter}
            setRecipientFilter={setRecipientFilter}
            emailAddresses={emailAddresses || []}
          />
        </div>

        {/* Mobile Filter Bar - Only show in list view on mobile */}
        {mobileView === 'list' && (
          <div className="lg:hidden flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { key: 'all', label: 'Primite', icon: Mail },
                { key: 'unread', label: 'Necitite', icon: null },
                { key: 'starred', label: 'Stea', icon: Star },
                { key: 'sent', label: 'Trimise', icon: Send },
                { key: 'archived', label: 'Arhivă', icon: Archive }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key as 'all' | 'unread' | 'starred' | 'archived' | 'sent')}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all",
                    filter === item.key 
                      ? "bg-gold/20 text-gold border border-gold/30" 
                      : "bg-white/5 text-muted-foreground border border-white/10"
                  )}
                >
                  {item.icon && <item.icon className="h-2.5 w-2.5" />}
                  {item.key === 'unread' && unreadCount > 0 && (
                    <span className="w-3.5 h-3.5 rounded-full bg-gold text-black text-[8px] flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                  {item.key === 'sent' && sentCount > 0 && (
                    <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-[8px] flex items-center justify-center font-bold">{sentCount > 9 ? '9+' : sentCount}</span>
                  )}
                  {item.key === 'archived' && archivedCount > 0 && (
                    <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-[8px] flex items-center justify-center font-bold">{archivedCount > 9 ? '9+' : archivedCount}</span>
                  )}
                  <span>{item.label}</span>
                </button>
              ))}
              {/* Drafts button inline with filters */}
              <Dialog open={showDrafts} onOpenChange={setShowDrafts}>
                <button
                  onClick={() => setShowDrafts(true)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all",
                    showDrafts 
                      ? "bg-gold/20 text-gold border border-gold/30" 
                      : "bg-white/5 text-muted-foreground border border-white/10"
                  )}
                >
                  <FileText className="h-2.5 w-2.5" />
                  {drafts && drafts.length > 0 && (
                    <span className="w-3.5 h-3.5 rounded-full bg-white/20 text-[8px] flex items-center justify-center font-bold">{drafts.length > 9 ? '9+' : drafts.length}</span>
                  )}
                  <span>Ciorne</span>
                </button>
                <DialogContent className="max-w-md bg-background border-white/10">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gold" />
                      Ciorne ({drafts?.length || 0})
                    </DialogTitle>
                    <DialogDescription>
                      Selectează o ciornă pentru a o încărca
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh]">
                    {drafts && drafts.length > 0 ? (
                      <div className="space-y-2">
                        {drafts.map((draft: any) => (
                          <div
                            key={draft.id}
                            className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <button
                                onClick={() => {
                                  handleLoadDraft(draft);
                                  setShowDrafts(false);
                                }}
                                className="flex-1 text-left"
                              >
                                <p className="text-sm font-medium truncate">
                                  {draft.subject || "(Fără subiect)"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  Către: {draft.recipient || "(Fără destinatar)"}
                                </p>
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                  {format(new Date(draft.updated_at), "d MMM, HH:mm", { locale: ro })}
                                </p>
                              </button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => handleDeleteDraft(e, draft.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">Nu ai ciorne salvate</p>
                      </div>
                    )}
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Mobile Recipient Filter */}
            {emailAddresses && emailAddresses.length > 0 && (
              <Select value={recipientFilter} onValueChange={setRecipientFilter}>
                <SelectTrigger className="h-7 text-[10px] bg-white/5 border-white/10 focus:border-gold/50">
                  <SelectValue placeholder="Toate adresele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate adresele</SelectItem>
                  {emailAddresses.map((addr) => (
                    <SelectItem key={addr.email} value={addr.email}>
                      {addr.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Email List - Full width on mobile when list view */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl md:rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden flex flex-col min-h-0",
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
          <div 
            ref={pullToRefresh.containerRef}
            className="flex-1 overflow-y-auto min-h-[200px]"
          >
            <PullToRefreshIndicator 
              pullDistance={pullToRefresh.pullDistance}
              isRefreshing={pullToRefresh.isRefreshing}
              progress={pullToRefresh.progress}
            />
            {(isLoading || !emails) && !pullToRefresh.isRefreshing ? (
              <EmailListSkeleton count={6} />
            ) : filteredEmails && filteredEmails.length === 0 ? (
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
                  isMobile ? (
                    <SwipeableEmailItem
                      key={email.id}
                      email={email}
                      isSelected={selectedEmail?.id === email.id}
                      onSelect={() => handleSelectEmail(email)}
                      onToggleStar={(e) => handleToggleStar(e, email)}
                      onDelete={() => filter === 'sent' ? deleteSentEmailMutation.mutate(email.id) : deleteEmailMutation.mutate(email.id)}
                      onArchive={() => archiveEmailMutation.mutate(email.id)}
                      extractSenderName={extractSenderName}
                      extractSenderInitials={extractSenderInitials}
                      formatEmailDate={formatEmailDate}
                    />
                  ) : (
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
                  )
                ))}
              </motion.div>
            )}
          </div>
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
            onUnarchive={() => {
              if (selectedEmail) {
                unarchiveEmailMutation.mutate(selectedEmail.id);
              }
            }}
            onDelete={handleDelete}
            isArchived={filter === 'archived'}
            extractSenderName={extractSenderName}
            extractSenderInitials={extractSenderInitials}
          />
        </div>
      </div>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-[hsl(220,30%,12%)] border-white/10 max-h-[90vh] flex flex-col overflow-hidden">
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
        <DialogContent className="max-w-2xl bg-[hsl(220,30%,12%)] border-white/10 h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden rounded-none sm:rounded-lg p-4 sm:p-6 gap-3 sm:gap-4">
          <DialogHeader className="shrink-0 space-y-1">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <PenSquare className="h-4 w-4 sm:h-5 sm:w-5 text-gold" />
              Email nou
            </DialogTitle>
            <DialogDescription className="flex items-center justify-between text-xs sm:text-sm">
              <span>Compune și trimite un email nou</span>
              {lastAutoSave && (
                <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500" />
                  Salvat la {format(lastAutoSave, 'HH:mm:ss')}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 sm:gap-4 flex-1 min-h-0 overflow-hidden">
            <div className="space-y-1 sm:space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <Label className="text-xs sm:text-sm">Către</Label>
                {!showCcBcc && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="text-[10px] sm:text-xs h-5 sm:h-6 text-gold px-2"
                    onClick={() => setShowCcBcc(true)}
                  >
                    CC/BCC
                  </Button>
                )}
              </div>
              <EmailAutocomplete
                value={composeTo}
                onChange={setComposeTo}
                placeholder="email@example.com"
              />
            </div>
            
            {showCcBcc && (
              <div className="flex gap-2 shrink-0">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs sm:text-sm">CC</Label>
                  <Input
                    value={composeCc}
                    onChange={(e) => setComposeCc(e.target.value)}
                    placeholder="cc@example.com"
                    className="bg-white/5 border-white/10 h-8 sm:h-10 text-sm"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs sm:text-sm">BCC</Label>
                  <Input
                    value={composeBcc}
                    onChange={(e) => setComposeBcc(e.target.value)}
                    placeholder="bcc@example.com"
                    className="bg-white/5 border-white/10 h-8 sm:h-10 text-sm"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-1 sm:space-y-2 shrink-0">
              <Label className="text-xs sm:text-sm">Subiect</Label>
              <Input
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Subiectul emailului"
                className="bg-white/5 border-white/10 h-8 sm:h-10 text-sm"
              />
            </div>
            
            <div className="flex-1 min-h-0 flex flex-col space-y-1 sm:space-y-2 overflow-hidden">
              <Label className="text-xs sm:text-sm shrink-0">Mesaj</Label>
              <div className="flex-1 min-h-0 overflow-hidden [&_.border]:border-white/10 [&_.bg-background]:bg-white/5">
                <RichTextEditor
                  value={composeBody}
                  onChange={setComposeBody}
                  placeholder="Scrie mesajul tău aici..."
                  className="h-full flex flex-col [&>div:last-child]:flex-1 [&>div:last-child]:overflow-y-auto [&_.ProseMirror]:min-h-[60px] sm:[&_.ProseMirror]:min-h-[100px]"
                />
              </div>
            </div>

            {composeAttachments.length > 0 && (
              <div className="shrink-0">
                <div className="flex flex-wrap gap-1.5">
                  {composeAttachments.map((file, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="flex items-center gap-1 py-0.5 px-2 bg-white/5 text-xs"
                    >
                      <Paperclip className="h-3 w-3" />
                      <span className="max-w-[100px] truncate">{file.name}</span>
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
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-3 border-t border-white/10 shrink-0">
            <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setComposeDialogOpen(false)} 
                className="border-white/10 flex-1 sm:flex-none h-9"
              >
                Anulează
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="border-white/10 flex-1 sm:flex-none h-9"
              >
                <Paperclip className="h-4 w-4 mr-1.5" />
                Atașează
              </Button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
              <Button 
                variant="secondary"
                size="sm"
                onClick={handleSaveDraft}
                disabled={saveDraftMutation.isPending}
                className="bg-white/5 hover:bg-white/10 flex-1 sm:flex-none h-9"
              >
                {saveDraftMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1.5" />
                    Salvează ciornă
                  </>
                )}
              </Button>
              <Button 
                size="sm"
                onClick={async () => {
                  await handleSendEmail();
                  if (currentDraftId) {
                    deleteDraftMutation.mutate(currentDraftId);
                    setCurrentDraftId(null);
                  }
                }}
                disabled={sendEmailMutation.isPending || !composeBody.trim() || !composeTo.trim()}
                className="bg-gradient-to-r from-gold to-gold-light text-black flex-1 sm:flex-none h-9"
              >
                {sendEmailMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Se trimite...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1.5" />
                    Trimite email
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InboxPage;
