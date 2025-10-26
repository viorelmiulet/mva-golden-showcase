import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CRMUser {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  role: "admin" | "agent";
  created_at: string;
  updated_at: string;
}

export interface Complex {
  id: string;
  name: string;
  location?: string;
  description?: string;
}

export const useCRMUsers = () => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["crm-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CRMUser[];
    },
  });

  const { data: complexes = [] } = useQuery({
    queryKey: ["crm-complexes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complexes")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Complex[];
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-users"] });
      toast.success("Rol actualizat cu succes");
    },
    onError: (error: any) => {
      toast.error("Eroare la actualizarea rolului: " + error.message);
    },
  });

  const updateUserComplexes = useMutation({
    mutationFn: async ({ userId, complexIds }: { userId: string; complexIds: string[] }) => {
      // First, delete existing assignments
      await supabase.from("user_complexes").delete().eq("user_id", userId);

      // Then, add new assignments
      if (complexIds.length > 0) {
        const { error } = await supabase
          .from("user_complexes")
          .insert(complexIds.map((complexId) => ({ user_id: userId, complex_id: complexId })));

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-complexes"] });
      toast.success("Complexe actualizate cu succes");
    },
    onError: (error: any) => {
      toast.error("Eroare la actualizarea complexelor: " + error.message);
    },
  });

  const getUserComplexes = async (userId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("user_complexes")
      .select("complex_id")
      .eq("user_id", userId);

    if (error) throw error;
    return data.map((item) => item.complex_id);
  };

  const addComplex = useMutation({
    mutationFn: async (complex: Omit<Complex, "id">) => {
      const { data, error } = await supabase
        .from("complexes")
        .insert([complex])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-complexes"] });
      toast.success("Complex adăugat cu succes");
    },
    onError: (error: any) => {
      toast.error("Eroare la adăugarea complexului: " + error.message);
    },
  });

  const deleteComplex = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("complexes").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-complexes"] });
      toast.success("Complex șters cu succes");
    },
    onError: (error: any) => {
      toast.error("Eroare la ștergerea complexului: " + error.message);
    },
  });

  return {
    users,
    complexes,
    isLoading,
    updateUserRole: updateUserRole.mutateAsync,
    updateUserComplexes: updateUserComplexes.mutateAsync,
    getUserComplexes,
    addComplex: addComplex.mutateAsync,
    deleteComplex: deleteComplex.mutateAsync,
  };
};
