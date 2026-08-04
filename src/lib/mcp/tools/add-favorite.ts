import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_favorite",
  title: "Save a favorite",
  description: "Save a merchant to the signed-in user's favorites.",
  inputSchema: {
    merchant_id: z.number().int().positive().describe("Numeric merchant id to save."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ merchant_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("favorites")
      .insert({ user_id: ctx.getUserId(), merchant_id })
      .select("id, merchant_id")
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { favorite: data },
    };
  },
});
