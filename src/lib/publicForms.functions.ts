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

const viewingSchema = z.object({
  property_id: z.string().max(64).nullable().optional(),
  property_title: z.string().min(1).max(300),
  customer_name: z.string().min(1).max(200),
  customer_phone: z.string().min(3).max(50),
  customer_email: z.string().email().max(320).nullable().optional(),
  preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalidă"),
  preferred_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Ora invalidă"),
  message: z.string().max(2000).nullable().optional(),
});

export const requestViewing = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => viewingSchema.parse(input))
  .handler(async ({ data }) => {
    const { createViewingRequest } = await import("./publicForms.server");
    const result = await createViewingRequest(data);
    if (!result.success) throw new Error("Eroare la trimiterea solicitării.");
    return { success: true as const };
  });
