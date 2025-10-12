import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JobApplicationData {
  fullName: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  coverLetter: string;
  cv?: {
    filename: string;
    content: string;
    contentType: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("=== JOB APPLICATION EMAIL FUNCTION CALLED ===");
  console.log("Method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing POST request...");
    
    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
    console.log("SendGrid API Key exists:", !!sendgridApiKey);
    
    if (!sendgridApiKey) {
      throw new Error("SENDGRID_API_KEY not configured");
    }
    
    const requestBody = await req.text();
    console.log("Request body received, length:", requestBody.length);
    
    const formData: JobApplicationData = JSON.parse(requestBody);
    console.log("Parsed application data:", { 
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      position: formData.position,
      experience: formData.experience,
      hasCv: !!formData.cv
    });

    // Prepare CV attachment if provided
    const attachments = formData.cv ? [{
      content: formData.cv.content,
      filename: formData.cv.filename,
      type: formData.cv.contentType,
      disposition: "attachment"
    }] : [];

    console.log("Sending job application email with", attachments.length, "attachments");

    const emailData: any = {
      personalizations: [
        {
          to: [{ email: "mvaperfectbusiness@gmail.com" }],
          subject: `Aplicare Carieră - ${formData.position} - ${formData.fullName}`
        }
      ],
      from: { 
        email: "noreply@mvaimobiliare.ro", 
        name: "MVA IMOBILIARE - Carieră" 
      },
      content: [
        {
          type: "text/html",
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #DAA520;">Aplicare Nouă pentru Carieră</h2>
              
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Informații Candidat:</h3>
                
                <p><strong>Nume complet:</strong> ${formData.fullName}</p>
                <p><strong>Email:</strong> <a href="mailto:${formData.email}">${formData.email}</a></p>
                <p><strong>Telefon:</strong> <a href="tel:${formData.phone}">${formData.phone}</a></p>
              </div>
              
              <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Detalii Aplicare:</h3>
                
                <p><strong>Poziție dorită:</strong> ${formData.position}</p>
                <p><strong>Experiență:</strong> ${formData.experience}</p>
                
                <h4 style="color: #333; margin-top: 20px;">Scrisoare de intenție:</h4>
                <div style="background-color: white; padding: 15px; border-left: 4px solid #DAA520; margin-top: 10px;">
                  ${formData.coverLetter.replace(/\n/g, '<br>')}
                </div>
              </div>
              
              ${formData.cv ? `
              <div style="background-color: #fff8dc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">CV Atașat:</h3>
                <p>Fișier: <strong>${formData.cv.filename}</strong></p>
              </div>
              ` : `
              <div style="background-color: #ffe4e1; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><em>Nu a fost atașat CV.</em></p>
              </div>
              `}
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #666; font-size: 12px;">
                Acest email a fost trimis prin formularul de carieră de pe website-ul MVA IMOBILIARE.
              </p>
            </div>
          `
        }
      ],
    };

    if (attachments.length > 0) {
      emailData.attachments = attachments;
    }

    const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(emailData)
    });

    if (emailResponse.ok) {
      console.log("Job application email sent successfully via SendGrid");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Aplicarea a fost trimisă cu succes!" 
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } else {
      const errorText = await emailResponse.text();
      console.error("SendGrid API error:", errorText);
      throw new Error(`SendGrid API error: ${errorText}`);
    }
  } catch (error: any) {
    console.error("Error in send-job-application function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Eroare la trimiterea aplicării. Vă rugăm încercați din nou." 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
