import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'view' 
  | 'export' 
  | 'login' 
  | 'logout'
  | 'import'
  | 'send_email'
  | 'generate_pdf'
  | 'sign_contract';

interface LogActionParams {
  actionType: AuditAction;
  tableName?: string;
  recordId?: string;
  recordTitle?: string;
  oldData?: Json;
  newData?: Json;
  metadata?: Json;
}

export const logAuditAction = async ({
  actionType,
  tableName,
  recordId,
  recordTitle,
  oldData,
  newData,
  metadata,
}: LogActionParams): Promise<void> => {
  try {
    // Use admin email from sessionStorage since we no longer use Supabase Auth
    const adminEmail = 'admin@mvaimobiliare.ro';

    const { error } = await supabase.from('audit_logs').insert([{
      user_id: null,
      user_email: adminEmail,
      action_type: actionType,
      table_name: tableName || null,
      record_id: recordId || null,
      record_title: recordTitle || null,
      old_data: oldData || null,
      new_data: newData || null,
      metadata: metadata || null,
      user_agent: navigator.userAgent,
    }]);

    if (error) {
      console.error('Failed to log audit action:', error);
    }
  } catch (err) {
    console.error('Audit log error:', err);
  }
};

export const useAuditLog = () => {
  return { logAction: logAuditAction };
};