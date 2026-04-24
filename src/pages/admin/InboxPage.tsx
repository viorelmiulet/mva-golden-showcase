import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isYesterday } from "date-fns";
import { ro } from "date-fns/locale";
import { 
  Loader2,
  Send,
  Save,
  Paperclip,
  Reply,
  Forward,
  X,
  Check,
  PenSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  RefreshCw,
  Star,
  Archive,
  Trash2,
  ArrowLeft,
  RotateCcw,
   Inbox,
   Maximize2,
   Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { 
  GmailSidebar, 
  GmailHeader, 
  GmailEmailList, 
  GmailEmailDetail,
  EmailAutocomplete,
  SwipeableEmailItem,
  EmailThreadView
} from "@/components/inbox";
import { MultiEmailInput } from "@/components/inbox/MultiEmailInput";
import EmailListSkeleton from "@/components/skeletons/EmailListSkeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/admin/PullToRefreshIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEmailThreads } from "@/hooks/useEmailThreads";

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
  is_deleted: boolean;
  received_at: string;
  created_at: string;
}

const InboxPage = () => {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<ReceivedEmail | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'archived' | 'sent' | 'trash'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyTo, setReplyTo] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  
  // Forward state
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [forwardTo, setForwardTo] = useState("");
  const [forwardCc, setForwardCc] = useState("");
  const [forwardBcc, setForwardBcc] = useState("");
  const [forwardSubject, setForwardSubject] = useState("");
  const [forwardBody, setForwardBody] = useState("");
  const [forwardAttachments, setForwardAttachments] = useState<File[]>([]);
  const [showForwardCcBcc, setShowForwardCcBcc] = useState(false);
  
  // Multi-select state
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());
  
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [emailListCollapsed, setEmailListCollapsed] = useState(false);
  const [isReadingFullscreen, setIsReadingFullscreen] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Clear selection when filter changes
  useEffect(() => {
    setSelectedEmailIds(new Set());
  }, [filter]);

  // Fetch drafts
  const { data: drafts, refetch: refetchDrafts } = useQuery({
    queryKey: ['email-drafts'],
    queryFn: async () => {
      // Drafts are admin-only, fetch all drafts
      const { data, error } = await supabase
        .from('email_drafts')
        .select('*')
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
            user_id: null,
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
      // If filter is 'sent', query sent_emails table instead
      if (filter === 'sent') {
        const { data, error } = await supabase
          .from('sent_emails')
          .select('*')
          .eq('is_deleted', false)
          .order('sent_at', { ascending: false });
        if (error) throw error;
        
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
          is_deleted: false,
          received_at: email.sent_at,
          created_at: email.created_at
        })) as ReceivedEmail[];
      }

      let query = supabase
        .from('received_emails')
        .select('*')
        .order('received_at', { ascending: false });

      if (filter === 'trash') {
        query = query.eq('is_deleted', true);
      } else if (filter === 'archived') {
        query = query.eq('is_archived', true).eq('is_deleted', false);
      } else {
        query = query.eq('is_archived', false).eq('is_deleted', false);
        if (filter === 'unread') {
          query = query.eq('is_read', false);
        } else if (filter === 'starred') {
          query = query.eq('is_starred', true);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ReceivedEmail[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  // Query for counts
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

  const { data: sentEmails } = useQuery({
    queryKey: ['sent-emails-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sent_emails')
        .select('id')
        .eq('is_deleted', false);
      if (error) throw error;
      return data;
    }
  });

  const { data: trashEmails } = useQuery({
    queryKey: ['received-emails-trash-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('received_emails')
        .select('id')
        .eq('is_deleted', true);
      if (error) throw error;
      return data;
    }
  });

  const archivedCount = archivedEmails?.length || 0;
  const sentCount = sentEmails?.length || 0;
  const trashCount = trashEmails?.length || 0;
  const unreadCount = emails?.filter(e => !e.is_read).length || 0;
  const starredCount = emails?.filter(e => e.is_starred).length || 0;

  // Fetch all sent emails for threading
  const { data: allSentEmails } = useQuery({
    queryKey: ['all-sent-emails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sent_emails')
        .select('*')
        .eq('is_deleted', false)
        .order('sent_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((email: any) => ({
        id: email.id,
        sender: email.from_address,
        recipient: email.recipient,
        subject: email.subject,
        body_plain: email.body_plain,
        body_html: email.body_html,
        stripped_text: email.body_plain,
        message_id: email.message_id,
        in_reply_to: email.in_reply_to,
        attachments: email.attachments || [],
        is_read: true,
        is_starred: false,
        is_archived: false,
        is_deleted: false,
        received_at: email.sent_at,
        created_at: email.created_at
      }));
    }
  });

  // Use email threads hook
  const { threads, getThreadById } = useEmailThreads(
    filter !== 'sent' ? emails : undefined, 
    allSentEmails
  );

  // Get current thread
  const currentThread = selectedThreadId ? getThreadById(selectedThreadId) : null;

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
    }
  });

  const moveToTrashMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('received_emails')
        .update({ is_deleted: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-emails'] });
      queryClient.invalidateQueries({ queryKey: ['received-emails-trash-count'] });
      setSelectedEmail(null);
      toast.success('Email mutat în coșul de gunoi');
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
      queryClient.invalidateQueries({ queryKey: ['received-emails-trash-count'] });
      setSelectedEmail(null);
      toast.success('Email șters definitiv');
    }
  });

  const restoreFromTrashMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('received_emails')
        .update({ is_deleted: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-emails'] });
      queryClient.invalidateQueries({ queryKey: ['received-emails-trash-count'] });
      setSelectedEmail(null);
      toast.success('Email restaurat');
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
      setSelectedEmail(null);
      toast.success('Email restaurat din arhivă');
    }
  });

  // Bulk mutations
  const bulkMarkAsReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('received_emails')
        .update({ is_read: true })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-emails'] });
      setSelectedEmailIds(new Set());
      toast.success('Emailurile au fost marcate ca citite');
    }
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('received_emails')
        .update({ is_archived: true })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-emails'] });
      queryClient.invalidateQueries({ queryKey: ['received-emails-archived-count'] });
      setSelectedEmailIds(new Set());
      toast.success('Emailurile au fost arhivate');
    }
  });

  const bulkUnarchiveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('received_emails')
        .update({ is_archived: false })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-emails'] });
      queryClient.invalidateQueries({ queryKey: ['received-emails-archived-count'] });
      setSelectedEmailIds(new Set());
      toast.success('Emailurile au fost dezarhivate');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('received_emails')
        .update({ is_deleted: true })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-emails'] });
      queryClient.invalidateQueries({ queryKey: ['received-emails-trash-count'] });
      setSelectedEmailIds(new Set());
      toast.success('Emailurile au fost mutate în coș');
    }
  });

  const bulkRestoreMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('received_emails')
        .update({ is_deleted: false })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-emails'] });
      queryClient.invalidateQueries({ queryKey: ['received-emails-trash-count'] });
      setSelectedEmailIds(new Set());
      toast.success('Emailurile au fost restaurate');
    }
  });

  const bulkPermanentDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('received_emails')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-emails'] });
      queryClient.invalidateQueries({ queryKey: ['received-emails-trash-count'] });
      setSelectedEmailIds(new Set());
      toast.success('Emailurile au fost șterse definitiv');
    }
  });

  const deleteSentEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sent_emails')
        .update({ is_deleted: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-sent-emails'] });
      queryClient.invalidateQueries({ queryKey: ['sent-emails-count'] });
      setSelectedEmail(null);
      toast.success('Email trimis șters');
    }
  });

  const toggleEmailSelection = (emailId: string) => {
    setSelectedEmailIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const selectAllEmails = () => {
    if (filteredEmails) {
      setSelectedEmailIds(new Set(filteredEmails.map(e => e.id)));
    }
  };

  const deselectAllEmails = () => {
    setSelectedEmailIds(new Set());
  };

  const sendReplyMutation = useMutation({
    mutationFn: async ({ to, subject, body, inReplyTo, replyFromAddress, attachments }: { 
      to: string; 
      subject: string; 
      body: string; 
      inReplyTo?: string;
      replyFromAddress?: string;
      attachments?: Array<{ filename: string; content: string; contentType: string }>;
    }) => {
      const { data, error } = await supabase.functions.invoke('reply-email', {
        body: { to, subject, body, inReplyTo, isReply: true, replyFromAddress, attachments: attachments || [] }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Răspunsul a fost trimis!');
      setReplyDialogOpen(false);
      setReplyBody("");
      setReplyAttachments([]);
    },
    onError: (error: any) => {
      toast.error(`Eroare la trimitere: ${error.message}`);
    }
  });

  const saveEmailContactMutation = useMutation({
    mutationFn: async (email: string) => {
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
    
    // Find the thread for this email
    const thread = getThreadById(email.id);
    if (thread) {
      setSelectedThreadId(thread.id);
    }
    
    if (!email.is_read) {
      updateEmailMutation.mutate({ id: email.id, updates: { is_read: true } });
    }
  };

  const handleBackToList = () => {
    setMobileView('list');
    setIsReadingFullscreen(false);
    setSelectedEmail(null);
    setSelectedThreadId(null);
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
    archiveEmailMutation.mutate(selectedEmail.id);
  };

  const handleDelete = () => {
    if (!selectedEmail) return;
    if (filter === 'sent') {
      deleteSentEmailMutation.mutate(selectedEmail.id);
    } else if (filter === 'trash') {
      deleteEmailMutation.mutate(selectedEmail.id);
    } else {
      moveToTrashMutation.mutate(selectedEmail.id);
    }
  };

  const handleRestore = () => {
    if (!selectedEmail) return;
    restoreFromTrashMutation.mutate(selectedEmail.id);
  };

  // Thread-aware reply handler
  const handleOpenReplyForEmail = (email: any) => {
    const emailMatch = email.sender.match(/<([^>]+)>/) || [null, email.sender];
    const senderEmail = email.type === 'sent' 
      ? (email.recipient?.match(/<([^>]+)>/)?.[1] || email.recipient || '')
      : (emailMatch[1] || email.sender);
    
    setReplyTo(senderEmail);
    setReplySubject(email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject || ''}`);
    setReplyBody("");
    setReplyAttachments([]);
    setReplyDialogOpen(true);
  };

  const handleOpenReply = () => {
    if (!selectedEmail) return;
    handleOpenReplyForEmail(selectedEmail);
  };

  // Thread-aware forward handler
  const handleOpenForwardForEmail = (email: any) => {
    const originalDate = format(new Date(email.received_at), 'EEEE, dd MMMM yyyy, HH:mm', { locale: ro });
    const originalBody = email.body_plain || email.stripped_text || '';
    
    const forwardedContent = `

---------- Mesaj redirecționat ----------
De la: ${email.sender}
Data: ${originalDate}
Subiect: ${email.subject || '(Fără subiect)'}

${originalBody}`;
    
    setForwardTo("");
    setForwardCc("");
    setForwardBcc("");
    setForwardSubject(email.subject?.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject || ''}`);
    setForwardBody(forwardedContent);
    setForwardAttachments([]);
    setShowForwardCcBcc(false);
    setForwardDialogOpen(true);
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

  const handleOpenForward = () => {
    if (!selectedEmail) return;
    handleOpenForwardForEmail(selectedEmail);
  };

  const handleSendForward = async () => {
    if (!forwardTo || !forwardBody.trim()) {
      toast.error('Completează destinatarul și mesajul');
      return;
    }
    
    const attachmentsData = await Promise.all(
      forwardAttachments.map(async (file) => ({
        filename: file.name,
        content: await fileToBase64(file),
        contentType: file.type || 'application/octet-stream'
      }))
    );

    sendEmailMutation.mutate({
      to: forwardTo,
      cc: forwardCc || undefined,
      bcc: forwardBcc || undefined,
      subject: forwardSubject,
      body: forwardBody,
      attachments: attachmentsData
    });
    
    setForwardDialogOpen(false);
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

  const filteredEmails = emails?.filter(email => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        email.sender.toLowerCase().includes(query) ||
        email.subject?.toLowerCase().includes(query) ||
        email.body_plain?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const mobileFilterItems = [
    { key: 'all' as const, label: 'Primite', icon: Inbox, count: unreadCount },
    { key: 'starred' as const, label: 'Cu stea', icon: Star, count: starredCount },
    { key: 'sent' as const, label: 'Trimise', icon: Send, count: 0 },
    { key: 'archived' as const, label: 'Arhivate', icon: Archive, count: archivedCount },
    { key: 'trash' as const, label: 'Coș', icon: Trash2, count: trashCount },
  ];

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col bg-background relative">
        {mobileView === 'list' ? (
          <>
            {/* Compact mobile header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/10 bg-background/95 backdrop-blur-md sticky top-0 z-40">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-sm shrink-0">
                <span className="text-primary-foreground font-bold text-[10px]">M</span>
              </div>
              <div className={cn(
                "flex-1 relative flex items-center rounded-lg h-9 transition-all",
                "bg-muted/40 border border-transparent focus-within:bg-background focus-within:border-border/40 focus-within:shadow-md"
              )}>
                <Search className="h-3.5 w-3.5 text-muted-foreground ml-2.5 shrink-0" />
                <Input
                  type="text"
                  placeholder="Caută..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm placeholder:text-muted-foreground/50 pl-1.5"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="p-1.5 mr-1">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-8 w-8 shrink-0">
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar border-b border-border/5 bg-background/90 shrink-0">
              {mobileFilterItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0",
                    filter === item.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                  )}
                >
                  <item.icon className="h-3 w-3" />
                  {item.label}
                  {item.count > 0 && (
                    <span className={cn(
                      "text-[10px] px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none",
                      filter === item.key ? "bg-primary-foreground/20" : "bg-muted"
                    )}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Email list */}
            <div 
              ref={pullToRefresh.containerRef}
              className="flex-1 overflow-y-auto"
            >
              <PullToRefreshIndicator 
                pullDistance={pullToRefresh.pullDistance}
                isRefreshing={pullToRefresh.isRefreshing}
                progress={pullToRefresh.progress}
              />
              {isLoading ? (
                <EmailListSkeleton count={6} />
              ) : filteredEmails && filteredEmails.length > 0 ? (
                filteredEmails.map((email) => (
                  <SwipeableEmailItem
                    key={email.id}
                    email={email}
                    isSelected={selectedEmail?.id === email.id}
                    onSelect={() => handleSelectEmail(email)}
                    onToggleStar={(e) => handleToggleStar(e, email)}
                    onDelete={() => filter === 'sent' ? deleteSentEmailMutation.mutate(email.id) : filter === 'trash' ? deleteEmailMutation.mutate(email.id) : moveToTrashMutation.mutate(email.id)}
                    onArchive={() => filter === 'trash' ? restoreFromTrashMutation.mutate(email.id) : archiveEmailMutation.mutate(email.id)}
                    extractSenderName={extractSenderName}
                    extractSenderInitials={extractSenderInitials}
                    formatEmailDate={formatEmailDate}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Archive className="h-12 w-12 text-muted-foreground/15 mb-3" />
                  <p className="text-sm font-medium">Niciun email</p>
                  <p className="text-xs text-muted-foreground/50 mt-0.5">
                    {filter === 'all' ? 'Inbox-ul este gol' : `Nu sunt emailuri în ${mobileFilterItems.find(f => f.key === filter)?.label?.toLowerCase()}`}
                  </p>
                </div>
              )}
            </div>

            {/* FAB Compose */}
            <button
              onClick={handleOpenCompose}
              className="absolute bottom-4 right-4 z-30 h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
            >
              <PenSquare className="h-5 w-5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col h-full">
            {/* Compact detail toolbar */}
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/10 bg-background/95 backdrop-blur-md sticky top-0 z-40 shrink-0">
              <Button variant="ghost" size="icon" onClick={handleBackToList} className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-0.5">
                {filter === 'trash' && (
                  <Button variant="ghost" size="icon" onClick={handleRestore} className="h-9 w-9">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
                {filter !== 'trash' && (
                  <Button variant="ghost" size="icon" onClick={handleArchive} className="h-9 w-9">
                    <Archive className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={handleDelete} className="h-9 w-9 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  if (selectedEmail) updateEmailMutation.mutate({ id: selectedEmail.id, updates: { is_starred: !selectedEmail.is_starred } });
                }} className="h-9 w-9">
                  <Star className={cn("h-4 w-4", selectedEmail?.is_starred ? "fill-gold text-gold" : "text-muted-foreground")} />
                </Button>
              </div>
            </div>
            
            {/* Email content */}
            <ScrollArea className="flex-1">
              <div className="px-4 py-4">
                {/* Subject */}
                <h1 className="text-lg font-semibold text-foreground mb-4 leading-snug">
                  {selectedEmail?.subject || '(Fără subiect)'}
                </h1>

                {/* Sender */}
                <div className="flex items-start gap-2.5 mb-4">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-primary/60 to-primary text-primary-foreground text-xs font-semibold">
                      {selectedEmail ? extractSenderInitials(selectedEmail.sender) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {selectedEmail ? extractSenderName(selectedEmail.sender) : ''}
                      </span>
                      <span className="text-[11px] text-muted-foreground/50 shrink-0 ml-2">
                        {selectedEmail ? formatEmailDate(selectedEmail.received_at) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/50 truncate">
                      către {selectedEmail?.recipient ? selectedEmail.recipient.replace(/<|>/g, '') : 'mine'}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="mb-6">
                  {selectedEmail?.body_html ? (
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-a:text-primary text-sm"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-sm text-foreground/85 leading-relaxed">
                      {selectedEmail?.body_plain || selectedEmail?.stripped_text || 'Nu există conținut'}
                    </div>
                  )}
                </div>

                {/* Attachments */}
                {selectedEmail?.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="border-t border-border/10 pt-4 mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Paperclip className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground/60">
                        {selectedEmail.attachments.length} atașament{selectedEmail.attachments.length > 1 ? 'e' : ''}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {selectedEmail.attachments.map((att: any, idx: number) => (
                        <a
                          key={idx}
                          href={att.url}
                          download={att.filename || att.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2.5 bg-muted/10 border border-border/10 rounded-lg text-xs"
                        >
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate flex-1">{att.filename || att.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={handleOpenReply} className="flex-1 gap-1.5 h-10 rounded-xl border-border/20">
                    <Reply className="h-3.5 w-3.5" /> Răspunde
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleOpenForward} className="flex-1 gap-1.5 h-10 rounded-xl border-border/20">
                    <Forward className="h-3.5 w-3.5" /> Redirecționează
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout - Outlook-style reading pane
  return (
    <>
    <div className="h-[calc(100vh-80px)] bg-muted/30 p-3">
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-border/30 bg-background shadow-sm">
        <GmailHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onRefresh={() => refetch()}
          isRefreshing={isLoading}
        />

        <div className="flex min-h-0 flex-1">
          {!isReadingFullscreen && (
            <GmailSidebar
              filter={filter}
              setFilter={setFilter}
              emailsCount={emails?.length || 0}
              unreadCount={unreadCount}
              starredCount={starredCount}
              archivedCount={archivedCount}
              sentCount={sentCount}
              trashCount={trashCount}
              draftsCount={drafts?.length || 0}
              onCompose={handleOpenCompose}
              onShowDrafts={() => setShowDrafts(true)}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          )}

          <div className="flex min-w-0 flex-1 bg-background">
            {isLoading ? (
              <div className={cn(
                "transition-all duration-300",
                emailListCollapsed || isReadingFullscreen ? "w-0 overflow-hidden" : "w-full max-w-[460px] border-r border-border/20 p-4"
              )}>
                {!emailListCollapsed && !isReadingFullscreen && <EmailListSkeleton count={10} />}
              </div>
            ) : (
              <div className={cn(
                "relative border-r border-border/20 transition-all duration-300",
                emailListCollapsed || isReadingFullscreen ? "w-0 overflow-hidden border-r-0" : "w-full max-w-[460px]"
              )}>
                {!emailListCollapsed && !isReadingFullscreen && (
                  <GmailEmailList
                    emails={filteredEmails || []}
                    selectedEmailId={selectedEmail?.id || null}
                    onSelectEmail={handleSelectEmail}
                    onToggleStar={handleToggleStar}
                    onDelete={(email) => {
                      if (filter === 'sent') {
                        deleteSentEmailMutation.mutate(email.id);
                      } else if (filter === 'trash') {
                        deleteEmailMutation.mutate(email.id);
                      } else {
                        moveToTrashMutation.mutate(email.id);
                      }
                    }}
                    onArchive={(email) => archiveEmailMutation.mutate(email.id)}
                    onRestore={filter === 'trash' ? (email) => restoreFromTrashMutation.mutate(email.id) : undefined}
                    extractSenderName={extractSenderName}
                    formatEmailDate={formatEmailDate}
                    isLoading={isLoading}
                    isTrashView={filter === 'trash'}
                    isArchivedView={filter === 'archived'}
                    selectedIds={selectedEmailIds}
                    onToggleSelect={toggleEmailSelection}
                    onSelectAll={selectAllEmails}
                    onDeselectAll={deselectAllEmails}
                    totalCount={emails?.length || 0}
                    onRefresh={() => refetch()}
                    onBulkDelete={() => {
                      if (filter === 'trash') {
                        bulkPermanentDeleteMutation.mutate(Array.from(selectedEmailIds));
                      } else {
                        bulkDeleteMutation.mutate(Array.from(selectedEmailIds));
                      }
                    }}
                    onBulkArchive={() => bulkArchiveMutation.mutate(Array.from(selectedEmailIds))}
                    onBulkUnarchive={filter === 'archived' ? () => bulkUnarchiveMutation.mutate(Array.from(selectedEmailIds)) : undefined}
                    onBulkMarkRead={() => bulkMarkAsReadMutation.mutate(Array.from(selectedEmailIds))}
                    onBulkRestore={filter === 'trash' ? () => bulkRestoreMutation.mutate(Array.from(selectedEmailIds)) : undefined}
                  />
                )}
              </div>
            )}

            <div className="relative min-w-0 flex-1 bg-muted/10">
              {!isReadingFullscreen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEmailListCollapsed(!emailListCollapsed)}
                  className="absolute left-3 top-3 z-10 h-9 w-9 rounded-xl border border-border/20 bg-background hover:bg-muted"
                >
                  {emailListCollapsed ? (
                    <PanelLeftOpen className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
                  )}
                </Button>
              )}

              {(selectedEmail || currentThread) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsReadingFullscreen(!isReadingFullscreen)}
                  className="absolute right-3 top-3 z-10 h-9 w-9 rounded-xl border border-border/20 bg-background hover:bg-muted"
                >
                  {isReadingFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              )}

              {currentThread && currentThread.emails.length > 1 ? (
                <EmailThreadView
                  thread={currentThread.emails}
                  subject={currentThread.subject}
                  onClose={handleBackToList}
                  onReply={handleOpenReplyForEmail}
                  onForward={handleOpenForwardForEmail}
                  onToggleStar={(email) => {
                    updateEmailMutation.mutate({ 
                      id: email.id, 
                      updates: { is_starred: !email.is_starred } 
                    });
                  }}
                  onArchive={handleArchive}
                  onUnarchive={() => {
                    if (selectedEmail) {
                      unarchiveEmailMutation.mutate(selectedEmail.id);
                    }
                  }}
                  onDelete={handleDelete}
                  onRestore={filter === 'trash' ? handleRestore : undefined}
                  isArchived={filter === 'archived'}
                  isTrashView={filter === 'trash'}
                  extractSenderName={extractSenderName}
                  extractSenderInitials={extractSenderInitials}
                />
              ) : (
                <GmailEmailDetail
                  email={selectedEmail}
                  onClose={handleBackToList}
                  onReply={handleOpenReply}
                  onForward={handleOpenForward}
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
                  onRestore={filter === 'trash' ? handleRestore : undefined}
                  isArchived={filter === 'archived'}
                  isTrashView={filter === 'trash'}
                  extractSenderName={extractSenderName}
                  extractSenderInitials={extractSenderInitials}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Drafts Dialog */}
      <Dialog open={showDrafts} onOpenChange={setShowDrafts}>
        <DialogContent className="max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenSquare className="h-5 w-5 text-primary" />
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
                    className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleLoadDraft(draft)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {draft.subject || "(Fără subiect)"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Către: {draft.recipient || "(Fără destinatar)"}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {format(new Date(draft.updated_at), "d MMM, HH:mm", { locale: ro })}
                        </p>
                      </div>
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
                <PenSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Nu ai ciorne salvate</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-background border-border max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5 text-primary" />
              Răspunde
            </DialogTitle>
            <DialogDescription>Trimite un răspuns către expeditor</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <Label>Către</Label>
              <Input
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="email@example.com"
                className="bg-muted/30 border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Subiect</Label>
              <Input
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                placeholder="Re: Subiect"
                className="bg-muted/30 border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Mesaj</Label>
              <Textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Scrie răspunsul tău aici..."
                className="min-h-[200px] max-h-[60vh] resize-y bg-muted/30 border-border"
              />
            </div>
            
            {selectedEmail && (
              <div className="p-3 bg-muted/20 rounded-xl text-sm border border-border/50">
                <p className="font-medium text-muted-foreground mb-1">Email original:</p>
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

      {/* Forward Dialog */}
      <Dialog open={forwardDialogOpen} onOpenChange={setForwardDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-background border-border max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Forward className="h-5 w-5 text-primary" />
              Redirecționează email
            </DialogTitle>
            <DialogDescription>Trimite emailul către altcineva</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Către</Label>
                {!showForwardCcBcc && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-6 text-primary px-2"
                    onClick={() => setShowForwardCcBcc(true)}
                  >
                    Cc/Bcc
                  </Button>
                )}
              </div>
              <EmailAutocomplete
                value={forwardTo}
                onChange={setForwardTo}
                placeholder="email@example.com"
              />
            </div>
            
            {showForwardCcBcc && (
              <>
                <div className="space-y-2">
                  <Label>Cc</Label>
                  <EmailAutocomplete
                    value={forwardCc}
                    onChange={setForwardCc}
                    placeholder="cc@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bcc</Label>
                  <EmailAutocomplete
                    value={forwardBcc}
                    onChange={setForwardBcc}
                    placeholder="bcc@example.com"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label>Subiect</Label>
              <Input
                value={forwardSubject}
                onChange={(e) => setForwardSubject(e.target.value)}
                placeholder="Fwd: Subiect"
                className="bg-muted/30 border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Mesaj</Label>
              <Textarea
                value={forwardBody}
                onChange={(e) => setForwardBody(e.target.value)}
                placeholder="Adaugă un mesaj..."
                className="min-h-[200px] max-h-[40vh] resize-y bg-muted/30 border-border"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setForwardDialogOpen(false)}>
              Anulează
            </Button>
            <Button 
              onClick={handleSendForward}
              disabled={sendEmailMutation.isPending || !forwardTo.trim()}
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

      {/* Compose Dialog */}
      <Dialog open={composeDialogOpen} onOpenChange={setComposeDialogOpen}>
        <DialogContent className="max-w-2xl bg-background border-border h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden rounded-none sm:rounded-lg p-4 sm:p-6 gap-3 sm:gap-4">
          <DialogHeader className="shrink-0 space-y-1">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <PenSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
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
                    className="text-[10px] sm:text-xs h-5 sm:h-6 text-primary px-2"
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
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs sm:text-sm">CC (mai multe adrese)</Label>
                  <MultiEmailInput
                    value={composeCc}
                    onChange={setComposeCc}
                    placeholder="cc@example.com"
                    className="bg-muted/30 border-border min-h-[36px] sm:min-h-[40px]"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs sm:text-sm">BCC (mai multe adrese)</Label>
                  <MultiEmailInput
                    value={composeBcc}
                    onChange={setComposeBcc}
                    placeholder="bcc@example.com"
                    className="bg-muted/30 border-border min-h-[36px] sm:min-h-[40px]"
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
                className="bg-muted/30 border-border h-8 sm:h-10 text-sm"
              />
            </div>
            
            <div className="flex-1 min-h-0 flex flex-col space-y-1 sm:space-y-2 overflow-hidden">
              <Label className="text-xs sm:text-sm shrink-0">Mesaj</Label>
              <div className="flex-1 min-h-0 overflow-hidden">
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
                      className="flex items-center gap-1 py-0.5 px-2 bg-muted/30 text-xs"
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

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-3 border-t border-border shrink-0">
            <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setComposeDialogOpen(false)} 
                className="flex-1 sm:flex-none h-9"
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
                className="flex-1 sm:flex-none h-9"
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
                className="bg-muted/30 hover:bg-muted/50 flex-1 sm:flex-none h-9"
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
                className="flex-1 sm:flex-none h-9"
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
    </>
  );
};

export default InboxPage;
