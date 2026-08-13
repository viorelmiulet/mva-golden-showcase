import { createServerFn } from "@tanstack/react-start";

/** Public, token-gated signing endpoint. The signing link is the credential. */
export const signContractFn = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; signatureDataUrl: string; signerName?: string }) => input)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data }): Promise<any> => {
    const { signContractWithToken } = await import("./signContract.server");
    return await signContractWithToken(data);
  });
