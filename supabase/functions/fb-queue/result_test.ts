import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
const API_KEY = Deno.env.get("FB_QUEUE_API_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/fb-queue`;

const admin = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false },
});

async function seedRow(attempts = 3) {
  const { data: offer } = await admin
    .from("catalog_offers")
    .select("id")
    .limit(1)
    .single();
  const { data, error } = await admin
    .from("fb_post_queue")
    .insert({
      offer_id: offer!.id,
      message: "test message",
      offer_url: "https://example.com/test",
      status: "posting",
      attempts,
      groups_done: [],
      errors: [],
    })
    .select("id")
    .single();
  if (error) throw error;
  return data!.id as string;
}

async function readRow(id: string) {
  const { data, error } = await admin
    .from("fb_post_queue")
    .select("attempts, status, groups_done, errors")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data!;
}

async function cleanup(id: string) {
  await admin.from("fb_post_queue").delete().eq("id", id);
}

async function postResult(payload: Record<string, unknown>) {
  const res = await fetch(`${FN_URL}/result`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY,
    },
    body: JSON.stringify(payload),
  });
  await res.text();
  return res.status;
}

Deno.test("ok=true does NOT increment attempts and appends to groups_done", async () => {
  const id = await seedRow(3);
  try {
    const status = await postResult({
      id,
      group_url: "https://facebook.com/groups/aaa",
      ok: true,
    });
    assertEquals(status, 200);

    const row = await readRow(id);
    assertEquals(row.attempts, 3, "attempts must stay the same on success");
    assertEquals(row.status, "pending");
    assertEquals(row.groups_done, ["https://facebook.com/groups/aaa"]);
    assertEquals(row.errors, []);
  } finally {
    await cleanup(id);
  }
});

Deno.test("ok=false increments attempts by 1 and appends to errors", async () => {
  const id = await seedRow(3);
  try {
    const status = await postResult({
      id,
      group_url: "https://facebook.com/groups/bbb",
      ok: false,
      error: "captcha",
    });
    assertEquals(status, 200);

    const row = await readRow(id);
    assertEquals(row.attempts, 4, "attempts must increment on failure");
    assertEquals(row.status, "pending");
    assertEquals(row.groups_done, []);
    assertEquals(row.errors, ["https://facebook.com/groups/bbb: captcha"]);
  } finally {
    await cleanup(id);
  }
});

Deno.test("many successful posts never trigger attempts>=10 exclusion", async () => {
  const id = await seedRow(0);
  try {
    for (let i = 0; i < 12; i++) {
      const status = await postResult({
        id,
        group_url: `https://facebook.com/groups/g${i}`,
        ok: true,
      });
      assertEquals(status, 200);
    }
    const row = await readRow(id);
    assertEquals(row.attempts, 0, "12 successful posts must keep attempts at 0");
    assertEquals((row.groups_done as string[]).length, 12);
  } finally {
    await cleanup(id);
  }
});

Deno.test("ok=true appends group_url to groups_done (single call)", async () => {
  const id = await seedRow(0);
  try {
    const url = "https://facebook.com/groups/success-1";
    const status = await postResult({ id, group_url: url, ok: true });
    assertEquals(status, 200);

    const row = await readRow(id);
    assertEquals(row.groups_done, [url]);
    assertEquals(row.errors, []);
  } finally {
    await cleanup(id);
  }
});

Deno.test("ok=true does not duplicate group_url in groups_done", async () => {
  const id = await seedRow(0);
  try {
    const url = "https://facebook.com/groups/dup";
    await postResult({ id, group_url: url, ok: true });
    await postResult({ id, group_url: url, ok: true });

    const row = await readRow(id);
    assertEquals(row.groups_done, [url], "duplicate posts must not repeat url");
  } finally {
    await cleanup(id);
  }
});

Deno.test("ok=false leaves groups_done unchanged", async () => {
  const id = await seedRow(0);
  try {
    // seed a successful post first
    const okUrl = "https://facebook.com/groups/ok-1";
    await postResult({ id, group_url: okUrl, ok: true });

    // now a failure — must NOT modify groups_done
    const failUrl = "https://facebook.com/groups/fail-1";
    const status = await postResult({
      id,
      group_url: failUrl,
      ok: false,
      error: "blocked",
    });
    assertEquals(status, 200);

    const row = await readRow(id);
    assertEquals(row.groups_done, [okUrl], "failure must not touch groups_done");
    assertEquals(row.errors, [`${failUrl}: blocked`]);
  } finally {
    await cleanup(id);
  }
});

Deno.test("mixed sequence: only ok=true entries land in groups_done", async () => {
  const id = await seedRow(0);
  try {
    const sequence: Array<{ url: string; ok: boolean }> = [
      { url: "https://facebook.com/groups/a", ok: true },
      { url: "https://facebook.com/groups/b", ok: false },
      { url: "https://facebook.com/groups/c", ok: true },
      { url: "https://facebook.com/groups/d", ok: false },
      { url: "https://facebook.com/groups/e", ok: true },
    ];
    for (const s of sequence) {
      await postResult({
        id,
        group_url: s.url,
        ok: s.ok,
        error: s.ok ? undefined : "err",
      });
    }

    const row = await readRow(id);
    assertEquals(row.groups_done, [
      "https://facebook.com/groups/a",
      "https://facebook.com/groups/c",
      "https://facebook.com/groups/e",
    ]);
    assertEquals(row.attempts, 2, "only failures increment attempts");
  } finally {
    await cleanup(id);
  }
});
