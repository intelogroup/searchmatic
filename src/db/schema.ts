import { pgTable, pgEnum, uuid, text, timestamp, boolean, jsonb, integer, date, real, vector, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const projectStatusEnum = pgEnum('project_status', ['active', 'completed', 'archived'])
export const articleStatusEnum = pgEnum('article_status', ['pending', 'processing', 'completed', 'error'])
export const articleSourceEnum = pgEnum('article_source', ['pubmed', 'scopus', 'wos', 'manual', 'other'])
export const screeningDecisionEnum = pgEnum('screening_decision', ['include', 'exclude', 'maybe'])
export const protocolStatusEnum = pgEnum('protocol_status', ['draft', 'active', 'archived', 'locked'])
export const frameworkTypeEnum = pgEnum('framework_type', ['pico', 'spider', 'other'])

// Tables
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().notNull(),
  email: text('email').unique().notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const userPreferences = pgTable('user_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  theme: text('theme').default('light'),
  language: text('language').default('en'),
  notificationsEnabled: boolean('notifications_enabled').default(true),
  emailNotifications: boolean('email_notifications').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: projectStatusEnum('status').default('active'),
  protocol: jsonb('protocol'),
  protocolLocked: boolean('protocol_locked').default(false),
  protocolLockedAt: timestamp('protocol_locked_at'),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const protocols = pgTable('protocols', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  projectId: uuid('project_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  researchQuestion: text('research_question').notNull(),
  frameworkType: frameworkTypeEnum('framework_type').default('pico'),
  status: protocolStatusEnum('status').default('draft'),
  version: integer('version').default(1),
  population: text('population'),
  intervention: text('intervention'),
  comparison: text('comparison'),
  outcome: text('outcome'),
  sample: text('sample'),
  phenomenon: text('phenomenon'),
  design: text('design'),
  evaluation: text('evaluation'),
  researchType: text('research_type'),
  inclusionCriteria: text('inclusion_criteria').array(),
  exclusionCriteria: text('exclusion_criteria').array(),
  keywords: text('keywords').array(),
  databases: text('databases').array(),
  isLocked: boolean('is_locked').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const protocolVersions = pgTable('protocol_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  protocolId: uuid('protocol_id').notNull(),
  versionNumber: integer('version_number').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  researchQuestion: text('research_question').notNull(),
  frameworkType: frameworkTypeEnum('framework_type').notNull(),
  changesSummary: text('changes_summary').notNull(),
  snapshotData: jsonb('snapshot_data').notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const searchQueries = pgTable('search_queries', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  databaseName: text('database_name').notNull(),
  queryString: text('query_string').notNull(),
  resultCount: integer('result_count'),
  executedAt: timestamp('executed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  externalId: text('external_id'),
  source: articleSourceEnum('source').notNull(),
  title: text('title').notNull(),
  authors: text('authors').array(),
  abstract: text('abstract'),
  publicationDate: date('publication_date'),
  journal: text('journal'),
  doi: text('doi'),
  pmid: text('pmid'),
  url: text('url'),
  pdfUrl: text('pdf_url'),
  pdfStoragePath: text('pdf_storage_path'),
  fullText: text('full_text'),
  extractedData: jsonb('extracted_data'),
  embedding: vector('embedding', { dimensions: 1536 }),
  status: articleStatusEnum('status').default('pending'),
  screeningDecision: screeningDecisionEnum('screening_decision'),
  screeningNotes: text('screening_notes'),
  duplicateOf: uuid('duplicate_of'),
  similarityScore: real('similarity_score'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    projectIdIdx: index('idx_articles_project_id').on(table.projectId),
    statusIdx: index('idx_articles_status').on(table.status),
    screeningDecisionIdx: index('idx_articles_screening_decision').on(table.screeningDecision),
  }
})

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id'),
  userId: uuid('user_id').notNull(),
  title: text('title'),
  context: text('context'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
})

export const extractionTemplates = pgTable('extraction_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  name: text('name').notNull(),
  fields: jsonb('fields').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const exportLogs = pgTable('export_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull(),
  userId: uuid('user_id').notNull(),
  filePath: text('file_path'),
  format: text('format'),
  filters: jsonb('filters'),
  createdAt: timestamp('created_at').defaultNow(),
})

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  projects: many(projects),
  conversations: many(conversations),
  exportLogs: many(exportLogs),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(profiles, {
    fields: [projects.userId],
    references: [profiles.id],
  }),
  searchQueries: many(searchQueries),
  articles: many(articles),
  conversations: many(conversations),
  extractionTemplates: many(extractionTemplates),
  exportLogs: many(exportLogs),
  protocols: many(protocols),
}))

export const protocolsRelations = relations(protocols, ({ one, many }) => ({
  project: one(projects, {
    fields: [protocols.projectId],
    references: [projects.id],
  }),
  user: one(profiles, {
    fields: [protocols.userId],
    references: [profiles.id],
  }),
  versions: many(protocolVersions),
}))

export const articlesRelations = relations(articles, ({ one }) => ({
  project: one(projects, {
    fields: [articles.projectId],
    references: [projects.id],
  }),
  duplicate: one(articles, {
    fields: [articles.duplicateOf],
    references: [articles.id],
  }),
}))

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  project: one(projects, {
    fields: [conversations.projectId],
    references: [projects.id],
  }),
  user: one(profiles, {
    fields: [conversations.userId],
    references: [profiles.id],
  }),
  messages: many(messages),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}))