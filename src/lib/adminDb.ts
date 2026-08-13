import { adminWriteFn } from "./adminWrite.functions";

/**
 * Drop-in replacement for `supabase.from(...)` WRITE chains inside the admin.
 *
 * Reads keep using the anon client. Writes are routed through a server
 * function that verifies the admin password server-side and performs the
 * write with the service role, so no anon RLS write policy is needed.
 *
 * Usage is identical to supabase-js:
 *   await adminDb.from("clients").update({ name }).eq("id", id);
 */

export const ADMIN_PASSWORD_STORAGE_KEY = "admin_pw";

export function getAdminPassword(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) || "";
}

export function setAdminPassword(password: string) {
  if (typeof window !== "undefined") sessionStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, password);
}

export function clearAdminPassword() {
  if (typeof window !== "undefined") sessionStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
}

type FilterType = "eq" | "neq" | "in" | "is" | "gte" | "lte" | "like" | "ilike";
type Filter = { type: FilterType; column: string; value: unknown };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Res<T = any> = { data: T; error: { message: string } | null };

class AdminWriteBuilder implements PromiseLike<Res> {
  private filters: Filter[] = [];
  private selectExpr: string | null = null;
  private singleMode: "single" | "maybeSingle" | null = null;
  private allowEmpty = false;

  constructor(
    private table: string,
    private op: "insert" | "update" | "upsert" | "delete",
    private values?: unknown,
    private onConflict?: string,
    private ignoreDuplicates?: boolean,
  ) {}

  private filter(type: FilterType, column: string, value: unknown) {
    this.filters.push({ type, column, value });
    return this;
  }

  eq(column: string, value: unknown) { return this.filter("eq", column, value); }
  neq(column: string, value: unknown) { return this.filter("neq", column, value); }
  in(column: string, value: unknown[]) { return this.filter("in", column, value); }
  is(column: string, value: unknown) { return this.filter("is", column, value); }
  gte(column: string, value: unknown) { return this.filter("gte", column, value); }
  lte(column: string, value: unknown) { return this.filter("lte", column, value); }
  like(column: string, value: unknown) { return this.filter("like", column, value); }
  ilike(column: string, value: unknown) { return this.filter("ilike", column, value); }

  select(expr = "*") { this.selectExpr = expr; return this; }
  single() { this.singleMode = "single"; return this; }
  maybeSingle() { this.singleMode = "maybeSingle"; return this; }
  /** Opt out of the "zero rows is an error" rule for best-effort writes. */
  allowNoRows() { this.allowEmpty = true; return this; }

  private async run(): Promise<Res> {
    const password = getAdminPassword();
    if (!password) {
      return { data: null, error: { message: "Sesiune admin expirată. Autentifică-te din nou." } };
    }
    try {
      const result = (await adminWriteFn({
        data: {
          password,
          spec: {
            table: this.table,
            op: this.op,
            values: this.values,
            onConflict: this.onConflict,
            ignoreDuplicates: this.ignoreDuplicates,
            filters: this.filters,
            select: this.selectExpr,
            single: this.singleMode,
            allowEmpty: this.allowEmpty,
          },
        },
      })) as Res;
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Eroare necunoscută";
      return { data: null, error: { message } };
    }
  }

  then<R1 = Res, R2 = never>(
    onfulfilled?: ((value: Res) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.run().then(onfulfilled, onrejected);
  }
}

class AdminTable {
  constructor(private table: string) {}
  insert(values: unknown) { return new AdminWriteBuilder(this.table, "insert", values); }
  update(values: unknown) { return new AdminWriteBuilder(this.table, "update", values); }
  upsert(values: unknown, options?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    return new AdminWriteBuilder(this.table, "upsert", values, options?.onConflict, options?.ignoreDuplicates);
  }
  delete() { return new AdminWriteBuilder(this.table, "delete"); }
}

export const adminDb = {
  from(table: string) {
    return new AdminTable(table);
  },
};
