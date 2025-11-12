import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ApartmentStatusManagerProps {
  projectId: string;
}

export const ApartmentStatusManager = ({ projectId }: ApartmentStatusManagerProps) => {
  const queryClient = useQueryClient();

  const { data: apartments = [], isLoading } = useQuery({
    queryKey: ["project-apartments", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_offers")
        .select("*")
        .eq("project_id", projectId)
        .order("title");

      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'available' | 'reserved' | 'sold' }) => {
      const { data, error } = await supabase.functions.invoke('admin-offers', {
        body: { action: 'update_status', id, availability_status: status },
      });

      if (error || data?.success === false) {
        throw new Error(data?.error || (error as any)?.message || 'Eroare la actualizarea statusului');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-apartments", projectId] });
      toast.success("Status actualizat cu succes");
    },
    onError: (error: any) => {
      toast.error("Eroare la actualizare: " + (error?.message || 'necunoscută'));
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  // Group by floor
  const groupedByFloor = apartments.reduce((acc: any, apt: any) => {
    const floor = apt.features?.find((f: string) => 
      f.includes('Parter') || f.includes('Etaj')
    ) || 'Altele';
    
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(apt);
    return acc;
  }, {});

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Management Status Apartamente</h3>
      
      <div className="space-y-6">
        {Object.entries(groupedByFloor).map(([floor, apts]: [string, any]) => (
          <div key={floor}>
            <h4 className="font-medium mb-3">{floor}</h4>
            <div className="space-y-2">
              {apts.map((apt: any) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{apt.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {apt.surface_min}mp - {apt.price_min.toLocaleString()}€ - {apt.price_max.toLocaleString()}€
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={apt.availability_status === 'available' ? 'default' : 'secondary'}
                      className="min-w-[100px] justify-center"
                    >
                      {apt.availability_status === 'available' ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Disponibil
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-1 h-3 w-3" />
                          Vândut
                        </>
                      )}
                    </Badge>
                    
                    <Select
                      value={apt.availability_status}
                      onValueChange={(value) =>
                        updateStatus.mutate({ id: apt.id, status: value as 'available' | 'reserved' | 'sold' })
                      }
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Disponibil</SelectItem>
                        <SelectItem value="sold">Vândut</SelectItem>
                        <SelectItem value="reserved">Rezervat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
