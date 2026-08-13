/**
 * Server-only implementation of the public, token-based contract signing.
 *
 * The signing link is the only credential a signer has, so the token is
 * verified here and the write is executed with the service role. This removes
 * the need for any anon INSERT/UPDATE policy on the contract tables.
 */

export type SignInput = {
  token: string;
  signatureDataUrl: string;
  signerName?: string;
};

type AnyRecord = Record<string, unknown>;

const fail = (error: string) => ({ success: false as const, error });

export async function signContractWithToken(input: SignInput) {
  const token = (input.token || "").trim();
  const signature = input.signatureDataUrl || "";
  if (!token) return fail("Token lipsă");
  if (!signature.startsWith("data:image/")) return fail("Semnătură invalidă");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as unknown as { from: (t: string) => any };
  const now = new Date().toISOString();

  // Composite token: <type>_<contractId>_<party>
  if (token.includes("_")) {
    const parts = token.split("_");
    if (parts.length < 3) return fail("Link de semnătură invalid");
    const type = parts[0];
    const contractId = parts.slice(1, -1).join("_");
    const party = parts[parts.length - 1]!;

    if (type === "comodat") {
      const sigField = party === "comodant" ? "comodant_signature" : "comodatar_signature";
      const atField = party === "comodant" ? "comodant_signed_at" : "comodatar_signed_at";
      const payload: AnyRecord = { [sigField]: signature, [atField]: now, status: "signed" };
      const { data, error } = await db
        .from("comodat_contracts")
        .update(payload)
        .eq("id", contractId)
        .select("id");
      if (error) return fail(error.message);
      if (!data?.length) return fail("Contractul nu a fost găsit");
      return { success: true as const, contractType: "comodat", contractId, partyType: party, signedAt: now };
    }

    if (type === "exclusiv") {
      const sigField = party === "beneficiary" ? "beneficiary_signature" : "agent_signature";
      const atField = party === "beneficiary" ? "beneficiary_signed_at" : "agent_signed_at";
      const payload: AnyRecord = { [sigField]: signature, [atField]: now, status: "signed" };
      const { data, error } = await db
        .from("exclusive_contracts")
        .update(payload)
        .eq("id", contractId)
        .select("id");
      if (error) return fail(error.message);
      if (!data?.length) return fail("Contractul nu a fost găsit");
      return { success: true as const, contractType: "exclusiv", contractId, partyType: party, signedAt: now };
    }

    if (type === "intermediere") {
      const partyType = party === "client" ? "chirias" : "proprietar";
      const signedField = party === "client" ? "chirias_signed" : "proprietar_signed";
      const { data: updated, error: upErr } = await db
        .from("contracts")
        .update({ [signedField]: true })
        .eq("id", contractId)
        .select("id, client_name");
      if (upErr) return fail(upErr.message);
      if (!updated?.length) return fail("Contractul nu a fost găsit");

      const { data: existing } = await db
        .from("contract_signatures")
        .select("id")
        .eq("contract_id", contractId)
        .eq("party_type", partyType)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await db
          .from("contract_signatures")
          .update({ signature_data: signature, signed_at: now })
          .eq("id", existing.id);
        if (error) return fail(error.message);
      } else {
        const { error } = await db.from("contract_signatures").insert({
          contract_id: contractId,
          party_type: partyType,
          signature_data: signature,
          signed_at: now,
          signer_name: input.signerName || updated[0]?.client_name || "",
        });
        if (error) return fail(error.message);
      }
      return { success: true as const, contractType: "intermediere", contractId, partyType, signedAt: now };
    }

    return fail("Tip de contract necunoscut");
  }

  // UUID token → rental contract signature row
  const { data: sig, error: sigErr } = await db
    .from("contract_signatures")
    .select("id, contract_id, party_type")
    .eq("signature_token", token)
    .maybeSingle();
  if (sigErr) return fail(sigErr.message);
  if (!sig) return fail("Link-ul de semnătură nu este valid sau a expirat");

  const { error: updSigErr } = await db
    .from("contract_signatures")
    .update({ signature_data: signature, signed_at: now, signer_name: input.signerName || null })
    .eq("id", sig.id);
  if (updSigErr) return fail(updSigErr.message);

  const field = sig.party_type === "proprietar" ? "proprietar_signed" : "chirias_signed";
  const { error: updContractErr } = await db
    .from("contracts")
    .update({ [field]: true })
    .eq("id", sig.contract_id);
  if (updContractErr) return fail(updContractErr.message);

  return {
    success: true as const,
    contractType: "inchiriere",
    contractId: sig.contract_id as string,
    partyType: sig.party_type as string,
    signedAt: now,
  };
}
