import { pgTable, serial, varchar, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // link, file, book, folder
  url: text("url"),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // ncert, study, notes, etc
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const plannerTasks = pgTable("planner_tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, done
  dueDate: varchar("due_date", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
