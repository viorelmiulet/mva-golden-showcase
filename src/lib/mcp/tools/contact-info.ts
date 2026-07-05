import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "contact_info",
  title: "Informații de contact MVA",
  description: "Returnează informațiile oficiale de contact ale agenției MVA Imobiliare.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const info = {
      name: "MVA Imobiliare",
      phone: "+40 767 941 512",
      whatsapp: "https://wa.me/40767941512",
      email: "contact@mvaimobiliare.ro",
      website: "https://mvaimobiliare.ro",
      area: "București (Militari, Sector 6), Chiajna și Ilfov",
      since: 2016,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
      structuredContent: info,
    };
  },
});
