import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_merchants",
  title: "Search happy hour spots",
  description:
    "Search active happy hour bars and restaurants by name, city, state, or neighborhood.",
  inputSchema: {
    query: z.string().trim().min(1).optional().describe("Name text to match, e.g. 'Dai Hachi'."),
    city: z.string().trim().min(1).optional().describe("City name, e.g. 'Brooklyn'."),
    state: z.string().trim().length(2).optional().describe("Two-letter state code, e.g. 'NY'."),
    neighborhood: z.string().trim().min(1).optional().describe("Neighborhood name."),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, city, state, neighborhood, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let builder = supabase
      .from("Merchant")
      .select(
        "id, restaurant_name, slug, street_address, city, state, zip_code, neighborhood, phone_number, website, verification_is_verified",
      )
      .eq("is_active", true)
      .limit(limit ?? 20);

    if (query) builder = builder.ilike("restaurant_name", `%${query}%`);
    if (city) builder = builder.ilike("city", city);
    if (state) builder = builder.ilike("state", state);
    if (neighborhood) builder = builder.ilike("neighborhood", `%${neighborhood}%`);

    const { data, error } = await builder;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { merchants: data ?? [] },
    };
  },
});
