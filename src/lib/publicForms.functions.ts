import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const contactSchema = z.object({
  nume: z.string().min(1).max(200),
  prenume: z.string().max(200).optional().default(""),
  email: z.string().email().max(320),
  telefon: z.string().min(3).max(50),
  mesaj: z.string().min(1).max(5000),
});

const attachmentSchema = z
  .object({
    filename: z.string().min(1).max(255),
    content: z.string().max(9_000_000),
    contentType: z.string().max(200).optional(),
  })
  .nullable()
  .optional();

const jobSchema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email().max(320),
  phone: z.string().min(3).max(50),
  position: z.string().min(1).max(200),
  experience: z.string().max(500),
  coverLetter: z.string().max(10000),
  cv: attachmentSchema,
});

export const submitContactForm = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactSchema.parse(input))
  .handler(async ({ data }) => {
    const { sendContactEmail } = await import("./publicForms.server");
    const result = await sendContactEmail(data);
    if (!result.success) throw new Error("Eroare la trimiterea mesajului.");
    return { success: true as const };
  });

export const submitJobApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => jobSchema.parse(input))
  .handler(async ({ data }) => {
    const { sendJobApplicationEmail } = await import("./publicForms.server");
    const result = await sendJobApplicationEmail({ ...data, cv: data.cv ?? null });
    if (!result.success) throw new Error("Eroare la trimiterea aplicării.");
    return { success: true as const };
  });
