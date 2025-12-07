import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCRMUsers, type CRMUser } from "@/hooks/useCRMUsers";
import { useUserRoles, type AppRole } from "@/hooks/useUserRoles";
import { Shield, Edit, Building2, Plus, Users, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ComplexImportManager from "@/components/ComplexImportManager";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const getRoleBadgeVariant = (role: AppRole | null) => {
  switch (role) {
    case "admin":
      return "default";
    case "agent":
      return "secondary";
    default:
      return "outline";
  }
};

const getRoleLabel = (role: AppRole | null) => {
  switch (role) {
    case "admin":
      return "Administrator";
    case "agent":
      return "Agent";
    case "visitor":
      return "Vizitator";
    default:
      return "Fără rol";
  }
};

export default function UsersAdminPage() {
  const {
    users,
    complexes,
    isLoading,
    updateUserRole,
    updateUserComplexes,
    getUserComplexes,
    addComplex,
    deleteComplex,
  } = useCRMUsers();

  const { isAdmin } = useUserRoles();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isComplexDialogOpen, setIsComplexDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CRMUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("visitor");
  const [selectedComplexes, setSelectedComplexes] = useState<string[]>([]);
  const [newComplexData, setNewComplexData] = useState({ name: "", location: "", description: "" });

  const handleEditUser = async (user: CRMUser) => {
    setSelectedUser(user);
    setSelectedRole(user.role || "visitor");
    const userComplexes = await getUserComplexes(user.user_id);
    setSelectedComplexes(userComplexes);
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    await updateUserRole({ userId: selectedUser.user_id, role: selectedRole });
    await updateUserComplexes({ userId: selectedUser.user_id, complexIds: selectedComplexes });

    setIsEditDialogOpen(false);
    setSelectedUser(null);
  };

  const handleAddComplex = async () => {
    if (!newComplexData.name.trim()) return;

    await addComplex(newComplexData);
    setNewComplexData({ name: "", location: "", description: "" });
    setIsComplexDialogOpen(false);
  };

  const toggleComplexSelection = (complexId: string) => {
    setSelectedComplexes((prev) =>
      prev.includes(complexId) ? prev.filter((id) => id !== complexId) : [...prev, complexId]
    );
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Se încarcă...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestionare Utilizatori</h1>
          <p className="text-muted-foreground">Atribuie roluri și complexe pentru agenți</p>
        </div>
        <Button onClick={() => setIsComplexDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Complex Nou
        </Button>
      </div>

      {/* Import System */}
      <ComplexImportManager />

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Utilizatori ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilizator</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Niciun utilizator găsit
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {user.full_name || "Nume nespecificat"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email || "-"}</TableCell>
                    <TableCell>{user.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditUser(user)}
                        title="Editează utilizator"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Complexes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Complexe ({complexes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {complexes.map((complex) => (
              <Card key={complex.id}>
                <CardHeader>
                  <CardTitle className="text-base">{complex.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{complex.location || "Locație nespecificată"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editează Utilizator</DialogTitle>
            <DialogDescription>
              Modifică rolul și complexele atribuite utilizatorului
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="visitor">Vizitator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Complexe Atribuite</Label>
              <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-3">
                {complexes.map((complex) => (
                  <div key={complex.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={complex.id}
                      checked={selectedComplexes.includes(complex.id)}
                      onCheckedChange={() => toggleComplexSelection(complex.id)}
                    />
                    <label
                      htmlFor={complex.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {complex.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleSaveUser}>Salvează Modificările</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Complex Dialog */}
      <Dialog open={isComplexDialogOpen} onOpenChange={setIsComplexDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complex Nou</DialogTitle>
            <DialogDescription>Adaugă un complex imobiliar nou în sistem</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="complex-name">Nume Complex *</Label>
              <Input
                id="complex-name"
                value={newComplexData.name}
                onChange={(e) => setNewComplexData({ ...newComplexData, name: e.target.value })}
                placeholder="Ex: Eurocasa Residence"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complex-location">Locație</Label>
              <Input
                id="complex-location"
                value={newComplexData.location}
                onChange={(e) =>
                  setNewComplexData({ ...newComplexData, location: e.target.value })
                }
                placeholder="Ex: Cluj-Napoca"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complex-description">Descriere</Label>
              <Input
                id="complex-description"
                value={newComplexData.description}
                onChange={(e) =>
                  setNewComplexData({ ...newComplexData, description: e.target.value })
                }
                placeholder="Descriere scurtă"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComplexDialogOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleAddComplex}>Adaugă Complex</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
