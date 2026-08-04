import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_merchant",
  title: "Get merchant details",
  description:
    "Get one merchant's profile plus its weekly happy hour windows and upcoming events, by id or slug.",
  inputSchema: {
    id: z.number().int().positive().optional().describe("Numeric merchant id."),
    slug: z.string().trim().min(1).optional().describe("Merchant slug from its profile URL."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, slug }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (!id && !slug) throw new ToolError("Provide either id or slug.");
    const supabase = supabaseForUser(ctx);

    let merchantQuery = supabase
      .from("Merchant")
      .select(
        "id, restaurant_name, slug, street_address, street_address_line_2, city, state, zip_code, neighborhood, phone_number, website, logo_url, latitude, longitude, verification_is_verified",
      )
      .eq("is_active", true)
      .limit(1);
    merchantQuery = id ? merchantQuery.eq("id", id) : merchantQuery.eq("slug", slug!);

    const { data: merchants, error } = await merchantQuery;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const merchant = merchants?.[0];
    if (!merchant) return { content: [{ type: "text", text: "Merchant not found" }], isError: true };

    const [{ data: happyHours }, { data: events }] = await Promise.all([
      supabase
        .from("merchant_happy_hour")
        .select("day_of_week, happy_hour_start, happy_hour_end")
        .eq("store_id", merchant.id)
        .order("day_of_week"),
      supabase
        .from("merchant_events")
        .select(
          "id, title, description, event_type, category_tags, event_date, start_time, end_time, recurrence_rule, recurrence_day",
        )
        .eq("restaurant_id", merchant.id)
        .eq("is_active", true)
        .limit(25),
    ]);

    const result = {
      merchant,
      happy_hours: happyHours ?? [],
      events: events ?? [],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
});
