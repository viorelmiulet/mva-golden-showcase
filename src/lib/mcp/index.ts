import { defineMcp } from "@lovable.dev/mcp-js";
import searchProperties from "./tools/search-properties";
import getProperty from "./tools/get-property";
import listComplexes from "./tools/list-complexes";
import contactInfo from "./tools/contact-info";

export default defineMcp({
  name: "mva-imobiliare-mcp",
  title: "MVA Imobiliare MCP",
  version: "0.1.0",
  instructions:
    "Acces la catalogul de proprietăți MVA Imobiliare (București - Militari, Sector 6, Chiajna, Ilfov). Folosește `search_properties` pentru filtrare, `get_property` pentru detalii după slug, `list_complexes` pentru ansambluri rezidențiale și `contact_info` pentru date de contact.",
  tools: [searchProperties, getProperty, listComplexes, contactInfo],
});
