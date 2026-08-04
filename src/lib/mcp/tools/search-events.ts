import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_events",
  title: "Search events",
  description:
    "Search active bar and restaurant events (trivia, DJ, live music, etc.) by city, neighborhood, category tag, or weekday.",
  inputSchema: {
    city: z.string().trim().min(1).optional().describe("City name, e.g. 'Brooklyn'."),
    neighborhood: z.string().trim().min(1).optional(),
    category_tag: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe("Category tag such as 'trivia', 'dj', or 'live-music'."),
    day_of_week: z
      .number()
      .int()
      .min(0)
      .max(6)
      .optional()
      .describe("Recurring weekday, 0 = Sunday through 6 = Saturday."),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ city, neighborhood, category_tag, day_of_week, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let builder = supabase
      .from("merchant_events")
      .select(
        "id, restaurant_id, title, description, event_type, category_tags, city, neighborhood, event_date, start_time, end_time, recurrence_rule, recurrence_day",
      )
      .eq("is_active", true)
      .limit(limit ?? 20);

    if (city) builder = builder.ilike("city", city);
    if (neighborhood) builder = builder.ilike("neighborhood", `%${neighborhood}%`);
    if (category_tag) builder = builder.contains("category_tags", [category_tag]);
    if (day_of_week !== undefined) builder = builder.eq("recurrence_day", day_of_week);

    const { data, error } = await builder;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { events: data ?? [] },
    };
  },
});
