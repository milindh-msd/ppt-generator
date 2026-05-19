import { pgTable, text, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const presentationsTable = pgTable("presentations", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  content: jsonb("content").notNull(),
  generationTimeSeconds: real("generation_time_seconds").notNull(),
  pptxPath: text("pptx_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPresentationSchema = createInsertSchema(presentationsTable).omit({
  createdAt: true,
});

export type InsertPresentation = z.infer<typeof insertPresentationSchema>;
export type DbPresentation = typeof presentationsTable.$inferSelect;
