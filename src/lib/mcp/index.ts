import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchMerchantsTool from "./tools/search-merchants";
import getMerchantTool from "./tools/get-merchant";
import searchEventsTool from "./tools/search-events";
import listFavoritesTool from "./tools/list-favorites";
import addFavoriteTool from "./tools/add-favorite";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "sipmunchyap",
  title: "sipmunchyap",
  version: "0.1.0",
  instructions:
    "Tools for SipMunchYap, a happy hour and events discovery app. Use `search_merchants` to find bars and restaurants, `get_merchant` for one spot's happy hour windows and events, `search_events` for trivia/DJ/live-music events, and `list_favorites` / `add_favorite` to read and update the signed-in user's saved spots.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchMerchantsTool,
    getMerchantTool,
    searchEventsTool,
    listFavoritesTool,
    addFavoriteTool,
  ],
});
