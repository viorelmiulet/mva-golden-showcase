import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Chrome, Copy, KeyRound, RefreshCw, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { getAdminPassword } from "@/lib/adminDb";
import {
  getExtensionKeyFn,
  generateExtensionKeyFn,
  revokeExtensionKeyFn,
} from "@/lib/extensionApi.functions";

type KeyInfo = {
  id: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  active: boolean;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function IntegrationsPage() {
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await getExtensionKeyFn({ data: { password: getAdminPassword() } });
      setKeyInfo(res?.key ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare la încărcarea cheii");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleGenerate = async () => {
    setBusy(true);
    try {
      const res: any = await generateExtensionKeyFn({ data: { password: getAdminPassword() } });
      setKeyInfo(res?.key ?? null);
      setNewKey(res?.apiKey ?? null);
      setConfirmGenerate(false);
      toast.success("API Key generat");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare la generarea cheii");
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async () => {
    setBusy(true);
    try {
      await revokeExtensionKeyFn({ data: { password: getAdminPassword() } });
      setKeyInfo(null);
      setConfirmRevoke(false);
      toast.success("API Key revocat");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare la revocarea cheii");
    } finally {
      setBusy(false);
    }
  };

  const copyKey = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    toast.success("Cheie copiată în clipboard");
  };

  const connected = !!keyInfo?.active;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrări</h1>
        <p className="text-muted-foreground">
          Conexiuni externe autorizate ale platformei MVA Imobiliare.
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Chrome className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Extensie Chrome – Facebook Post</CardTitle>
                <CardDescription>
                  Conectează extensia Chrome existentă pentru gestionarea și publicarea anunțurilor
                  MVA Imobiliare pe Facebook.
                </CardDescription>
              </div>
            </div>
            <Badge variant={connected ? "default" : "secondary"}>
              {connected ? "Conectată" : "Neconectată"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">API Key</p>
              <p className="font-mono text-sm">
                {connected ? `${keyInfo!.key_prefix}••••••••••••` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Ultima utilizare</p>
              <p className="text-sm">
                {connected
                  ? keyInfo!.last_used_at
                    ? formatDate(keyInfo!.last_used_at)
                    : "Nu a fost utilizată încă."
                  : "—"}
              </p>
            </div>
            {connected && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Creată la</p>
                <p className="text-sm">{formatDate(keyInfo!.created_at)}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!connected ? (
              <Button onClick={() => setConfirmGenerate(true)} disabled={loading || busy}>
                <KeyRound className="mr-2 h-4 w-4" />
                Generează API Key
              </Button>
            ) : (
              <>
                <Button onClick={() => setConfirmGenerate(true)} disabled={busy}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generează cheie nouă
                </Button>
                <Button variant="outline" onClick={() => setConfirmRevoke(true)} disabled={busy}>
                  <ShieldOff className="mr-2 h-4 w-4" />
                  Revocă API Key
                </Button>
              </>
            )}
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm space-y-1">
            <p className="font-semibold">Endpoint-uri disponibile pentru extensie</p>
            <p className="font-mono text-xs">GET /api/public/extension/facebook/status</p>
            <p className="font-mono text-xs">GET /api/public/extension/facebook/listings</p>
            <p className="font-mono text-xs">GET /api/public/extension/facebook/listings/:id</p>
            <p className="font-mono text-xs">POST /api/public/extension/facebook/publications</p>
            <p className="pt-2">
              Autentificare: header <code className="font-mono">Authorization: Bearer &lt;API_KEY&gt;</code>
            </p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmGenerate} onOpenChange={setConfirmGenerate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generezi un API Key nou pentru extensia Chrome?</AlertDialogTitle>
            <AlertDialogDescription>Cheia actuală va fi invalidată.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void handleGenerate(); }} disabled={busy}>
              Generează
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoci API Key-ul extensiei?</AlertDialogTitle>
            <AlertDialogDescription>
              Extensia va pierde imediat accesul. Orice cerere ulterioară va primi eroare 401.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void handleRevoke(); }} disabled={busy}>
              Revocă
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!newKey} onOpenChange={(open) => !open && setNewKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key generat</DialogTitle>
            <DialogDescription>
              Salvează această cheie. Din motive de securitate, cheia completă nu va mai fi afișată
              după închiderea acestei ferestre.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input readOnly value={newKey ?? ""} className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={copyKey} aria-label="Copiază cheia">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={copyKey}>Copiază cheia</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
