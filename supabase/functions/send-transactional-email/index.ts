import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendMailgunEmail } from '../_shared/mailgun.ts';
import { getFromAddressForFunction } from '../_shared/emailSettings.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Brand constants ──
const BRAND = {
  gold: '#DAA520',
  goldDark: '#B8860B',
  dark: '#1a1a1a',
  darkAlt: '#2d2d2d',
  white: '#ffffff',
  lightBg: '#f8f9fa',
  grey: '#666666',
  greyLight: '#888888',
  green: '#22c55e',
  greenDark: '#16a34a',
};

const emailWrapper = (title: string, subtitle: string, body: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: ${BRAND.lightBg};">
  <div style="max-width: 600px; margin: 0 auto;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${BRAND.dark} 0%, ${BRAND.darkAlt} 100%); padding: 30px; text-align: center;">
      <h1 style="color: ${BRAND.gold}; margin: 0; font-size: 24px; letter-spacing: 2px;">MVA IMOBILIARE</h1>
      <p style="color: ${BRAND.greyLight}; margin: 10px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 3px;">${subtitle}</p>
    </div>
    <!-- Body -->
    <div style="background-color: ${BRAND.white}; padding: 40px 30px;">
      <h2 style="color: ${BRAND.dark}; margin: 0 0 20px 0; font-size: 22px;">${title}</h2>
      ${body}
    </div>
    <!-- Footer -->
    <div style="background-color: ${BRAND.dark}; padding: 20px 30px; text-align: center;">
      <p style="color: ${BRAND.grey}; margin: 0; font-size: 12px;">Acest email a fost trimis automat de MVA Imobiliare.</p>
      <p style="color: ${BRAND.gold}; margin: 10px 0 0 0; font-size: 11px;">© ${new Date().getFullYear()} MVA IMOBILIARE</p>
    </div>
  </div>
</body>
</html>`;

// ── Template: Welcome ──
function welcomeEmail(data: { name: string; email: string }) {
  const body = `
    <p style="color: #4a4a4a; line-height: 1.8; margin: 0 0 20px 0;">
      Bine ai venit, <strong>${data.name}</strong>! 🎉
    </p>
    <p style="color: #4a4a4a; line-height: 1.8; margin: 0 0 20px 0;">
      Contul tău pe platforma MVA Imobiliare a fost creat cu succes. Acum poți:
    </p>
    <ul style="color: #4a4a4a; line-height: 2; padding-left: 20px; margin: 0 0 25px 0;">
      <li>Salva proprietăți la favorite</li>
      <li>Programa vizionări online</li>
      <li>Primi notificări pentru proprietăți noi</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://mvaimobiliare.ro/proprietati" 
         style="display: inline-block; background: linear-gradient(135deg, ${BRAND.gold} 0%, ${BRAND.goldDark} 100%); color: ${BRAND.white}; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">
        Explorează Proprietăți
      </a>
    </div>
    <p style="color: #999; font-size: 13px; margin: 20px 0 0 0;">
      Dacă ai întrebări, ne poți contacta oricând la <a href="mailto:contact@mvaimobiliare.ro" style="color: ${BRAND.gold};">contact@mvaimobiliare.ro</a> sau la <a href="tel:+40769272272" style="color: ${BRAND.gold};">0769 272 272</a>.
    </p>`;
  return {
    subject: `Bine ai venit la MVA Imobiliare, ${data.name}! 🏠`,
    html: emailWrapper('Bine ai venit!', 'Cont Nou', body),
  };
}

// ── Template: Contract Signed ──
function contractSignedEmail(data: {
  propertyAddress: string;
  proprietarName: string;
  chiriasName: string;
  contractType?: string;
  recipientType: 'proprietar' | 'chirias' | 'admin';
}) {
  const recipientGreeting = data.recipientType === 'admin'
    ? 'Ambele părți au semnat contractul.'
    : 'Contractul a fost semnat de ambele părți și este acum valid.';

  const body = `
    <div style="background-color: #f0fdf4; border-left: 4px solid ${BRAND.green}; padding: 15px; margin: 0 0 25px 0; border-radius: 0 8px 8px 0;">
      <p style="color: #166534; margin: 0; font-weight: 600;">✓ Contract complet semnat</p>
    </div>
    <p style="color: #4a4a4a; line-height: 1.8; margin: 0 0 20px 0;">${recipientGreeting}</p>
    <div style="background-color: ${BRAND.lightBg}; padding: 20px; border-radius: 8px; margin: 0 0 25px 0;">
      <table style="width: 100%;">
        <tr><td style="padding: 8px 0; color: ${BRAND.grey};">Proprietate:</td><td style="padding: 8px 0; color: ${BRAND.dark}; font-weight: bold;">${data.propertyAddress}</td></tr>
        <tr><td style="padding: 8px 0; color: ${BRAND.grey};">Proprietar:</td><td style="padding: 8px 0; color: ${BRAND.dark}; font-weight: bold;">${data.proprietarName}</td></tr>
        <tr><td style="padding: 8px 0; color: ${BRAND.grey};">Chiriaș:</td><td style="padding: 8px 0; color: ${BRAND.dark}; font-weight: bold;">${data.chiriasName}</td></tr>
      </table>
    </div>
    ${data.recipientType === 'admin' ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://mvaimobiliare.ro/admin/contracte" 
         style="display: inline-block; background: linear-gradient(135deg, ${BRAND.gold} 0%, ${BRAND.goldDark} 100%); color: ${BRAND.white}; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Vezi Contract în Admin
      </a>
    </div>` : `
    <p style="color: #4a4a4a; line-height: 1.8;">
      Documentul PDF final poate fi descărcat de la agentul dumneavoastră MVA Imobiliare.
    </p>`}`;
  return {
    subject: `✓ Contract Complet Semnat - ${data.propertyAddress}`,
    html: emailWrapper('Contract Semnat cu Succes', 'Notificare Contract', body),
  };
}

// ── Template: Viewing Confirmation ──
function viewingConfirmationEmail(data: {
  customerName: string;
  propertyTitle: string;
  preferredDate: string;
  preferredTime: string;
  propertyLink?: string;
}) {
  const formattedDate = new Date(data.preferredDate).toLocaleDateString('ro-RO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const body = `
    <p style="color: #4a4a4a; line-height: 1.8; margin: 0 0 20px 0;">
      Bună, <strong>${data.customerName}</strong>! 👋
    </p>
    <p style="color: #4a4a4a; line-height: 1.8; margin: 0 0 25px 0;">
      Cererea ta de vizionare a fost înregistrată cu succes. Un agent MVA te va contacta în curând pentru confirmare.
    </p>
    <div style="background: linear-gradient(135deg, ${BRAND.gold} 0%, ${BRAND.goldDark} 100%); padding: 20px; border-radius: 8px; margin: 0 0 25px 0;">
      <h3 style="color: ${BRAND.white}; margin: 0 0 15px 0; font-size: 16px;">📍 Detalii Vizionare</h3>
      <table style="width: 100%;">
        <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.8);">Proprietate:</td><td style="padding: 6px 0; color: ${BRAND.white}; font-weight: bold;">${data.propertyTitle}</td></tr>
        <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.8);">Data preferată:</td><td style="padding: 6px 0; color: ${BRAND.white}; font-weight: bold;">${formattedDate}</td></tr>
        <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.8);">Ora preferată:</td><td style="padding: 6px 0; color: ${BRAND.white}; font-weight: bold;">${data.preferredTime}</td></tr>
      </table>
    </div>
    ${data.propertyLink ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.propertyLink}" 
         style="display: inline-block; background: linear-gradient(135deg, ${BRAND.dark} 0%, ${BRAND.darkAlt} 100%); color: ${BRAND.gold}; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; border: 1px solid ${BRAND.gold};">
        Vezi Proprietatea
      </a>
    </div>` : ''}
    <p style="color: #999; font-size: 13px; margin: 20px 0 0 0;">
      Dacă dorești să modifici sau anulezi vizionarea, contactează-ne la <a href="tel:+40769272272" style="color: ${BRAND.gold};">0769 272 272</a>.
    </p>`;
  return {
    subject: `Confirmare vizionare - ${data.propertyTitle}`,
    html: emailWrapper('Vizionare Programată', 'Confirmare Programare', body),
  };
}

// ── Router ──
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template, data } = await req.json();
    console.log('[send-transactional-email] Template:', template);

    let emailContent: { subject: string; html: string };
    let recipients: string[];
    let functionName = 'transactional';

    switch (template) {
      case 'welcome': {
        emailContent = welcomeEmail(data);
        recipients = [data.email];
        functionName = 'welcome';
        break;
      }
      case 'contract-signed': {
        emailContent = contractSignedEmail(data);
        // Send to admin + optionally to parties
        recipients = data.recipientEmail ? [data.recipientEmail] : ['contact@mvaimobiliare.ro'];
        functionName = 'contract-signed';
        break;
      }
      case 'viewing-confirmation': {
        emailContent = viewingConfirmationEmail(data);
        recipients = [data.customerEmail];
        functionName = 'viewing-confirmation';
        break;
      }
      default:
        return new Response(
          JSON.stringify({ error: `Unknown template: ${template}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const fromAddress = await getFromAddressForFunction(functionName);

    const result = await sendMailgunEmail({
      to: recipients,
      subject: emailContent.subject,
      html: emailContent.html,
      from: fromAddress,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    console.log('[send-transactional-email] Sent successfully:', result.messageId);

    return new Response(
      JSON.stringify({ success: true, messageId: result.messageId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[send-transactional-email] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
