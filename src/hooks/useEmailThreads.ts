import { useMemo } from 'react';

interface Email {
  id: string;
  sender: string;
  recipient: string | null;
  subject: string | null;
  body_plain: string | null;
  body_html: string | null;
  stripped_text?: string | null;
  message_id?: string | null;
  in_reply_to?: string | null;
  is_read: boolean;
  is_starred: boolean;
  is_archived?: boolean;
  is_deleted?: boolean;
  attachments: any[];
  received_at: string;
  created_at?: string;
  type?: 'sent' | 'received';
}

interface ThreadEmail extends Email {
  type: 'sent' | 'received';
}

interface EmailThread {
  id: string;
  subject: string;
  participants: string[];
  lastEmail: ThreadEmail;
  emails: ThreadEmail[];
  unreadCount: number;
  hasStarred: boolean;
  lastActivity: string;
}

// Extract email address from sender string like "Name <email@example.com>"
const extractEmail = (sender: string): string => {
  const match = sender.match(/<([^>]+)>/);
  return (match ? match[1] : sender).toLowerCase().trim();
};

// Normalize subject by removing Re:, Fwd:, etc.
const normalizeSubject = (subject: string | null): string => {
  if (!subject) return '';
  return subject
    .replace(/^(re|fwd|fw|răspuns|redirecționat):\s*/gi, '')
    .trim()
    .toLowerCase();
};

export const useEmailThreads = (
  receivedEmails: Email[] | undefined,
  sentEmails: Email[] | undefined
): { threads: EmailThread[]; getThreadById: (id: string) => EmailThread | undefined } => {
  const threads = useMemo(() => {
    if (!receivedEmails && !sentEmails) return [];

    // Combine all emails with type marker
    const allEmails: ThreadEmail[] = [
      ...(receivedEmails || []).map(e => ({ ...e, type: 'received' as const })),
      ...(sentEmails || []).map(e => ({ ...e, type: 'sent' as const })),
    ];

    // Sort by date
    allEmails.sort((a, b) => 
      new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
    );

    // Group emails into threads
    const threadMap = new Map<string, ThreadEmail[]>();
    const emailToThread = new Map<string, string>();

    for (const email of allEmails) {
      const normalizedSubject = normalizeSubject(email.subject);
      const senderEmail = extractEmail(email.sender);
      const recipientEmail = email.recipient ? extractEmail(email.recipient) : '';

      // Create a thread key based on subject and participants
      // This groups emails with same subject between same participants
      const participants = [senderEmail, recipientEmail].filter(Boolean).sort();
      const threadKey = `${normalizedSubject}::${participants.join(',')}`;

      // Check if we already have a thread with this key or similar
      let foundThreadKey: string | undefined;

      // First check by message_id/in_reply_to chain
      if (email.in_reply_to) {
        foundThreadKey = emailToThread.get(email.in_reply_to);
      }

      // If not found by reply chain, check by subject + participants
      if (!foundThreadKey) {
        for (const [key, emails] of threadMap.entries()) {
          const existingNormalizedSubject = normalizeSubject(emails[0].subject);
          if (existingNormalizedSubject === normalizedSubject) {
            // Check if participants overlap
            const existingParticipants = new Set(
              emails.flatMap(e => [
                extractEmail(e.sender),
                e.recipient ? extractEmail(e.recipient) : ''
              ].filter(Boolean))
            );
            
            if (
              existingParticipants.has(senderEmail) || 
              existingParticipants.has(recipientEmail)
            ) {
              foundThreadKey = key;
              break;
            }
          }
        }
      }

      const targetKey = foundThreadKey || threadKey;
      
      if (!threadMap.has(targetKey)) {
        threadMap.set(targetKey, []);
      }
      
      threadMap.get(targetKey)!.push(email);
      
      // Track message_id for reply chain matching
      if (email.message_id) {
        emailToThread.set(email.message_id, targetKey);
      }
    }

    // Convert to thread objects
    const threadList: EmailThread[] = [];

    for (const [key, emails] of threadMap.entries()) {
      // Sort emails in thread by date
      emails.sort((a, b) => 
        new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
      );

      const lastEmail = emails[emails.length - 1];
      const participants = [...new Set(
        emails.flatMap(e => [
          extractEmail(e.sender),
          e.recipient ? extractEmail(e.recipient) : ''
        ].filter(Boolean))
      )];

      threadList.push({
        id: emails[0].id, // Use first email's ID as thread ID
        subject: lastEmail.subject || '(Fără subiect)',
        participants,
        lastEmail,
        emails,
        unreadCount: emails.filter(e => !e.is_read && e.type === 'received').length,
        hasStarred: emails.some(e => e.is_starred),
        lastActivity: lastEmail.received_at,
      });
    }

    // Sort threads by last activity (most recent first)
    threadList.sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );

    return threadList;
  }, [receivedEmails, sentEmails]);

  const getThreadById = (id: string): EmailThread | undefined => {
    return threads.find(t => t.id === id || t.emails.some(e => e.id === id));
  };

  return { threads, getThreadById };
};
