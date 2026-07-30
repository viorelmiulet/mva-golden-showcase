/**
 * Server-only email templates + senders for the public forms.
 * Ports supabase/functions/send-contact-email and send-job-application.
 */
import {
  sendMailgunEmail,
  getFromAddressForFunction,
  type MailgunAttachment,
} from "./email.server";

const INBOX = "mvaperfectbusiness@gmail.com";

const esc = (v?: string | null) =>
  (v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const nl2br = (v?: string | null) => esc(v).replace(/\n/g, "<br>");

export interface ContactFormPayload {
  nume: string;
  prenume?: string;
  email: string;
  telefon: string;
  mesaj: string;
}

export async function sendContactEmail(data: ContactFormPayload) {
  const from = await getFromAddressForFunction("contact");
  const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DAA520;">Cerere de contact nouă</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Informații contact:</h3>
            <p><strong>Nume:</strong> ${esc(data.nume)}</p>
            <p><strong>Prenume:</strong> ${esc(data.prenume)}</p>
            <p><strong>Email:</strong> <a href="mailto:${esc(data.email)}">${esc(data.email)}</a></p>
            <p><strong>Telefon:</strong> <a href="tel:${esc(data.telefon)}">${esc(data.telefon)}</a></p>
            <h3 style="color: #333; margin-top: 30px;">Mesaj:</h3>
            <div style="background-color: white; padding: 15px; border-left: 4px solid #DAA520; margin-top: 10px;">
              ${nl2br(data.mesaj)}
            </div>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Acest email a fost trimis prin formularul de contact de pe website-ul MVA IMOBILIARE.
          </p>
        </div>
      `;

  return sendMailgunEmail({
    to: [INBOX],
    subject: "Cerere de contact - MVA IMOBILIARE",
    html,
    from,
  });
}

export interface JobApplicationPayload {
  fullName: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  coverLetter: string;
  cv?: MailgunAttachment | null;
}

export async function sendJobApplicationEmail(data: JobApplicationPayload) {
  const attachments = data.cv ? [data.cv] : [];
  const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DAA520;">Aplicare Nouă pentru Carieră</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Informații Candidat:</h3>
            <p><strong>Nume complet:</strong> ${esc(data.fullName)}</p>
            <p><strong>Email:</strong> <a href="mailto:${esc(data.email)}">${esc(data.email)}</a></p>
            <p><strong>Telefon:</strong> <a href="tel:${esc(data.phone)}">${esc(data.phone)}</a></p>
          </div>
          <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Detalii Aplicare:</h3>
            <p><strong>Poziție dorită:</strong> ${esc(data.position)}</p>
            <p><strong>Experiență:</strong> ${esc(data.experience)}</p>
            <h4 style="color: #333; margin-top: 20px;">Scrisoare de intenție:</h4>
            <div style="background-color: white; padding: 15px; border-left: 4px solid #DAA520; margin-top: 10px;">
              ${nl2br(data.coverLetter)}
            </div>
          </div>
          ${
            data.cv
              ? `<div style="background-color: #fff8dc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">CV Atașat:</h3>
            <p>Fișier: <strong>${esc(data.cv.filename)}</strong></p>
          </div>`
              : `<div style="background-color: #ffe4e1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><em>Nu a fost atașat CV.</em></p>
          </div>`
          }
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Acest email a fost trimis prin formularul de carieră de pe website-ul MVA IMOBILIARE.
          </p>
        </div>
      `;

  return sendMailgunEmail({
    to: [INBOX],
    subject: `Aplicare Carieră - ${data.position} - ${data.fullName}`,
    html,
    from: "MVA IMOBILIARE - Carieră <noreply@mvaimobiliare.ro>",
    attachments,
  });
}
