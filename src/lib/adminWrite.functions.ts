import { createServerFn } from "@tanstack/react-start";

/** Executes an admin write with the service role after verifying the admin password. */
export const adminWriteFn = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string; spec: unknown }) => input)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data }): Promise<any> => {
    const { assertAdmin, runAdminWrite } = await import("./adminWrite.server");
    await assertAdmin(data.password);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await runAdminWrite(data.spec as any);
  });

/** Changes the server-held admin password. */
export const adminChangePasswordFn = createServerFn({ method: "POST" })
  .inputValidator((input: { currentPassword: string; newPassword: string }) => input)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data }): Promise<any> => {
    const { changeAdminPassword } = await import("./adminWrite.server");
    return await changeAdminPassword(data.currentPassword, data.newPassword);
  });

/** Verifies a password server-side (used by the admin login screen). */
export const adminVerifyPasswordFn = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { assertAdmin } = await import("./adminWrite.server");
    try {
      await assertAdmin(data.password);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });
