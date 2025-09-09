import React, { useState } from 'react';
import { useApiKeys, CreateApiKeyData, ApiKey } from '@/hooks/useApiKeys';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Copy, Key, Plus, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKeyFormProps {
  onSubmit: (data: CreateApiKeyData) => void;
  isLoading: boolean;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<CreateApiKeyData>({
    key_name: '',
    description: '',
    expires_at: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.key_name.trim()) {
      toast.error('Numele cheii API este obligatoriu');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="key_name">Nume cheie API *</Label>
        <Input
          id="key_name"
          placeholder="ex: Integrare CRM"
          value={formData.key_name}
          onChange={(e) => setFormData(prev => ({ ...prev, key_name: e.target.value }))}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descriere</Label>
        <Textarea
          id="description"
          placeholder="Descriere opțională pentru această cheie API"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="expires_at">Data expirării (opțional)</Label>
        <Input
          id="expires_at"
          type="datetime-local"
          value={formData.expires_at}
          onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
        Creează cheie API
      </Button>
    </form>
  );
};

interface ApiKeyCardProps {
  apiKey: ApiKey;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

const ApiKeyCard: React.FC<ApiKeyCardProps> = ({ apiKey, onToggle, onDelete }) => {
  const [showKey, setShowKey] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiat în clipboard!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ro-RO');
  };

  const isExpired = apiKey.expires_at && new Date(apiKey.expires_at) < new Date();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{apiKey.key_name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Badge variant={apiKey.is_active && !isExpired ? "default" : "secondary"}>
                {isExpired ? "Expirată" : apiKey.is_active ? "Activă" : "Inactivă"}
              </Badge>
              {apiKey.usage_count > 0 && (
                <span className="text-sm text-muted-foreground">
                  {apiKey.usage_count} utilizări
                </span>
              )}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={apiKey.is_active}
              onCheckedChange={(checked) => onToggle(apiKey.id, checked)}
              disabled={isExpired}
            />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Șterge cheia API</AlertDialogTitle>
                  <AlertDialogDescription>
                    Această acțiune nu poate fi anulată. Cheia API va fi ștearsă permanent și nu va mai putea fi folosită.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anulează</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(apiKey.id)}>
                    Șterge
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {apiKey.description && (
          <p className="text-sm text-muted-foreground">{apiKey.description}</p>
        )}
        
        <div className="space-y-2">
          <Label className="text-sm font-medium">Cheie API</Label>
          <div className="flex items-center gap-2">
            <Input
              type={showKey ? "text" : "password"}
              value={apiKey.api_key}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(apiKey.api_key)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground">Creată la</Label>
            <p>{formatDate(apiKey.created_at)}</p>
          </div>
          
          {apiKey.expires_at && (
            <div>
              <Label className="text-xs text-muted-foreground">Expiră la</Label>
              <p className={isExpired ? "text-red-600" : ""}>
                {formatDate(apiKey.expires_at)}
              </p>
            </div>
          )}
          
          {apiKey.last_used_at && (
            <div>
              <Label className="text-xs text-muted-foreground">Ultima utilizare</Label>
              <p>{formatDate(apiKey.last_used_at)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ApiKeysManager: React.FC = () => {
  const { apiKeys, isLoading, error, createApiKey, toggleApiKey, deleteApiKey, fetchApiKeys } = useApiKeys();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateApiKey = async (data: CreateApiKeyData) => {
    const newKey = await createApiKey(data);
    if (newKey) {
      toast.success('Cheia API a fost creată cu succes!');
      setIsCreateDialogOpen(false);
    }
  };

  const handleToggleApiKey = async (id: string, isActive: boolean) => {
    const success = await toggleApiKey(id, isActive);
    if (success) {
      toast.success(isActive ? 'Cheia API a fost activată' : 'Cheia API a fost dezactivată');
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    const success = await deleteApiKey(id);
    if (success) {
      toast.success('Cheia API a fost ștearsă');
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Eroare</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchApiKeys} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Încearcă din nou
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestionare chei API</h2>
          <p className="text-muted-foreground">
            Creează și gestionează chei API pentru integrarea cu alte platforme
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Creează cheie API
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Creează o nouă cheie API</DialogTitle>
              <DialogDescription>
                Completează detaliile pentru a genera o nouă cheie API
              </DialogDescription>
            </DialogHeader>
            <ApiKeyForm onSubmit={handleCreateApiKey} isLoading={isLoading} />
          </DialogContent>
        </Dialog>
      </div>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Documentație API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Endpoint-uri disponibile:</h4>
            <ul className="space-y-2 text-sm">
              <li><code className="bg-background px-2 py-1 rounded">GET /offers</code> - Lista ofertelor imobiliare</li>
              <li><code className="bg-background px-2 py-1 rounded">GET /projects</code> - Lista proiectelor imobiliare</li>
              <li><code className="bg-background px-2 py-1 rounded">GET /stats</code> - Statistici generale</li>
            </ul>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Autentificare:</h4>
            <p className="text-sm">Adaugă header-ul: <code className="bg-background px-2 py-1 rounded">x-api-key: [CHEIA_TA_API]</code></p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">URL de bază:</h4>
            <code className="bg-background px-2 py-1 rounded text-sm">
              https://gfobqeycviqckzjyokxf.supabase.co/functions/v1/public-api/
            </code>
          </div>
        </CardContent>
      </Card>

      {/* API Keys List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Chei API existente</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
        ) : apiKeys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Key className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nu există chei API create încă
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {apiKeys.map((apiKey) => (
              <ApiKeyCard
                key={apiKey.id}
                apiKey={apiKey}
                onToggle={handleToggleApiKey}
                onDelete={handleDeleteApiKey}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiKeysManager;