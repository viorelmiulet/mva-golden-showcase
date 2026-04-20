import { supabase } from "@/integrations/supabase/client";

// Generic admin API helper that uses edge function with service role
export const adminApi = {
  async select<T>(
    table: string,
    options?: { orderBy?: string; ascending?: boolean }
  ): Promise<{ success: boolean; data?: T[]; error?: string }> {
    const { data: result, error } = await supabase.functions.invoke("admin-complexes", {
      body: {
        action: "select",
        table,
        orderBy: options?.orderBy,
        ascending: options?.ascending,
      },
    });

    if (error) {
      console.error("Admin select error:", error);
      const errorMsg = typeof error === "object" && error.message ? error.message : String(error);
      return { success: false, error: errorMsg };
    }

    return result;
  },

  async insert<T>(table: string, data: Partial<T>): Promise<{ success: boolean; data?: T[]; error?: string }> {
    console.log('Admin insert:', table, JSON.stringify(data).substring(0, 200));
    const { data: result, error } = await supabase.functions.invoke('admin-complexes', {
      body: { action: 'insert', table, data }
    });

    if (error) {
      console.error('Admin insert error:', error, 'result:', result);
      const errorMsg = typeof error === 'object' && error.message ? error.message : String(error);
      return { success: false, error: errorMsg };
    }

    return result;
  },

  async upsert<T>(
    table: string,
    data: Partial<T> | Partial<T>[],
    onConflict: string = "id"
  ): Promise<{ success: boolean; data?: T[]; error?: string }> {
    const { data: result, error } = await supabase.functions.invoke('admin-complexes', {
      body: { action: 'upsert', table, data, onConflict }
    });

    if (error) {
      console.error('Admin upsert error:', error);
      const errorMsg = typeof error === 'object' && error.message ? error.message : String(error);
      return { success: false, error: errorMsg };
    }

    return result;
  },

  async update<T>(table: string, id: string, data: Partial<T>): Promise<{ success: boolean; data?: T[]; error?: string }> {
    const { data: result, error } = await supabase.functions.invoke('admin-complexes', {
      body: { action: 'update', table, id, data }
    });

    if (error) {
      console.error('Admin update error:', error);
      return { success: false, error: error.message };
    }

    return result;
  },

  async delete(table: string, id: string): Promise<{ success: boolean; error?: string }> {
    const { data: result, error } = await supabase.functions.invoke('admin-complexes', {
      body: { action: 'delete', table, id }
    });

    if (error) {
      console.error('Admin delete error:', error);
      return { success: false, error: error.message };
    }

    return result;
  },

  // Specific complex operations (keeping for backwards compatibility)
  async insertComplex(data: Record<string, unknown>): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
    const { data: result, error } = await supabase.functions.invoke('admin-complexes', {
      body: { action: 'insert_complex', data }
    });

    if (error) {
      console.error('Admin insert complex error:', error);
      return { success: false, error: error.message };
    }

    return result;
  },

  async updateComplex(id: string, data: Record<string, unknown>): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
    const { data: result, error } = await supabase.functions.invoke('admin-complexes', {
      body: { action: 'update_complex', id, data }
    });

    if (error) {
      console.error('Admin update complex error:', error);
      return { success: false, error: error.message };
    }

    return result;
  },

  async deleteComplex(id: string): Promise<{ success: boolean; error?: string }> {
    const { data: result, error } = await supabase.functions.invoke('admin-complexes', {
      body: { action: 'delete_complex', id }
    });

    if (error) {
      console.error('Admin delete complex error:', error);
      return { success: false, error: error.message };
    }

    return result;
  }
};
