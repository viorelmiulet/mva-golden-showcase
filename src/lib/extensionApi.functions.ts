import { createServerFn } from "@tanstack/react-start";

/** Reads the current extension API key metadata (never the raw key). */
export const getExtensionKeyFn = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string }) => input)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data }): Promise<any> => {
    const { assertAdmin } = await import("./adminWrite.server");
    await assertAdmin(data.password);
    const { getActiveKeyInfo } = await import("./extensionApi.server");
    return { success: true, key: await getActiveKeyInfo() };
  });

/** Revokes the current key and issues a new one. Raw key returned once. */
export const generateExtensionKeyFn = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string }) => input)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data }): Promise<any> => {
    const { assertAdmin } = await import("./adminWrite.server");
    await assertAdmin(data.password);
    const { generateKey } = await import("./extensionApi.server");
    const { apiKey, info } = await generateKey();
    return { success: true, apiKey, key: info };
  });

/** Revokes every active extension key. */
export const revokeExtensionKeyFn = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string }) => input)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data }): Promise<any> => {
    const { assertAdmin } = await import("./adminWrite.server");
    await assertAdmin(data.password);
    const { revokeAllKeys } = await import("./extensionApi.server");
    const revoked = await revokeAllKeys();
    return { success: true, revoked };
  });
