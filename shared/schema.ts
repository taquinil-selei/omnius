import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for multi-tenant support
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("developer"), // developer, architect, admin
  createdAt: timestamp("created_at").defaultNow(),
});

// Projects/Tenants
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Artifacts - core entity for the system
export const artifacts = pgTable("artifacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  type: text("type").notNull(), // Requirement, UseCase, ModelElement, SourceCode, DBEntity, APIContract, BPMN, UITemplate, TestCase, etc.
  origin: text("origin").notNull(), // source system/tool
  locator: text("locator").notNull(), // file path, URL, or identifier
  schemaRef: text("schema_ref"), // reference to schema definition
  contentHash: text("content_hash"), // for change detection
  version: text("version").default("1.0.0"),
  metadata: jsonb("metadata"), // flexible metadata storage
  content: text("content"), // actual artifact content
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Links between artifacts (the graph structure)
export const artifactLinks = pgTable("artifact_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromId: varchar("from_id").references(() => artifacts.id).notNull(),
  toId: varchar("to_id").references(() => artifacts.id).notNull(),
  kind: text("kind").notNull(), // implements, verifies, generates, deploysTo, dependsOn
  cardinality: text("cardinality").default("1:1"), // 1:1, 1:N, N:M
  confidence: integer("confidence").default(100), // AI confidence score
  createdBy: text("created_by").notNull(), // human, ai, rule
  createdAt: timestamp("created_at").defaultNow(),
});

// Policies for compliance checking
export const policies = pgTable("policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  scope: text("scope").notNull(), // model:code, req:test, api:impl
  expression: text("expression").notNull(), // rule logic
  severity: text("severity").notNull(), // LOW, MEDIUM, HIGH, CRITICAL
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Compliance check results
export const findings = pgTable("findings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  policyId: varchar("policy_id").references(() => policies.id).notNull(),
  severity: text("severity").notNull(),
  message: text("message").notNull(),
  artifactRefs: jsonb("artifact_refs"), // array of artifact IDs
  status: text("status").default("open"), // open, acknowledged, resolved
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// CLUI command history
export const commandHistory = pgTable("command_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  command: text("command").notNull(),
  result: text("result"),
  success: boolean("success").default(true),
  executedAt: timestamp("executed_at").defaultNow(),
});

// Integrations configuration
export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  type: text("type").notNull(), // git, database, cicd
  name: text("name").notNull(),
  config: jsonb("config").notNull(),
  enabled: boolean("enabled").default(true),
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  role: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
});

export const insertArtifactSchema = createInsertSchema(artifacts).pick({
  projectId: true,
  type: true,
  origin: true,
  locator: true,
  schemaRef: true,
  contentHash: true,
  version: true,
  metadata: true,
  content: true,
});

export const insertArtifactLinkSchema = createInsertSchema(artifactLinks).pick({
  fromId: true,
  toId: true,
  kind: true,
  cardinality: true,
  confidence: true,
  createdBy: true,
});

export const insertPolicySchema = createInsertSchema(policies).pick({
  projectId: true,
  scope: true,
  expression: true,
  severity: true,
  enabled: true,
});

export const insertFindingSchema = createInsertSchema(findings).pick({
  projectId: true,
  policyId: true,
  severity: true,
  message: true,
  artifactRefs: true,
  status: true,
});

export const insertCommandSchema = createInsertSchema(commandHistory).pick({
  projectId: true,
  userId: true,
  command: true,
  result: true,
  success: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).pick({
  projectId: true,
  type: true,
  name: true,
  config: true,
  enabled: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = z.infer<typeof insertArtifactSchema>;

export type ArtifactLink = typeof artifactLinks.$inferSelect;
export type InsertArtifactLink = z.infer<typeof insertArtifactLinkSchema>;

export type Policy = typeof policies.$inferSelect;
export type InsertPolicy = z.infer<typeof insertPolicySchema>;

export type Finding = typeof findings.$inferSelect;
export type InsertFinding = z.infer<typeof insertFindingSchema>;

export type CommandHistory = typeof commandHistory.$inferSelect;
export type InsertCommand = z.infer<typeof insertCommandSchema>;

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;

// Dashboard metrics type
export interface DashboardMetrics {
  totalArtifacts: number;
  complianceScore: number;
  activeFindings: number;
  testCoverage: number;
  artifactDistribution: Array<{
    type: string;
    count: number;
    color: string;
  }>;
  recentFindings: Finding[];
  complianceTrends: Array<{
    date: string;
    score: number;
  }>;
}
