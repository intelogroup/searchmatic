CREATE TYPE "public"."article_source" AS ENUM('pubmed', 'scopus', 'wos', 'manual', 'other');--> statement-breakpoint
CREATE TYPE "public"."article_status" AS ENUM('pending', 'processing', 'completed', 'error');--> statement-breakpoint
CREATE TYPE "public"."framework_type" AS ENUM('pico', 'spider', 'other');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."protocol_status" AS ENUM('draft', 'active', 'archived', 'locked');--> statement-breakpoint
CREATE TYPE "public"."screening_decision" AS ENUM('include', 'exclude', 'maybe');--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"external_id" text,
	"source" "article_source" NOT NULL,
	"title" text NOT NULL,
	"authors" text[],
	"abstract" text,
	"publication_date" date,
	"journal" text,
	"doi" text,
	"pmid" text,
	"url" text,
	"pdf_url" text,
	"pdf_storage_path" text,
	"full_text" text,
	"extracted_data" jsonb,
	"embedding" vector(1536),
	"status" "article_status" DEFAULT 'pending',
	"screening_decision" "screening_decision",
	"screening_notes" text,
	"duplicate_of" uuid,
	"similarity_score" real,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"user_id" uuid NOT NULL,
	"title" text,
	"context" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "export_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"file_path" text,
	"format" text,
	"filters" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "extraction_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"fields" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "project_status" DEFAULT 'active',
	"protocol" jsonb,
	"protocol_locked" boolean DEFAULT false,
	"protocol_locked_at" timestamp,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "protocol_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"research_question" text NOT NULL,
	"framework_type" "framework_type" NOT NULL,
	"changes_summary" text NOT NULL,
	"snapshot_data" jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "protocols" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"research_question" text NOT NULL,
	"framework_type" "framework_type" DEFAULT 'pico',
	"status" "protocol_status" DEFAULT 'draft',
	"version" integer DEFAULT 1,
	"population" text,
	"intervention" text,
	"comparison" text,
	"outcome" text,
	"sample" text,
	"phenomenon" text,
	"design" text,
	"evaluation" text,
	"research_type" text,
	"inclusion_criteria" text[],
	"exclusion_criteria" text[],
	"keywords" text[],
	"databases" text[],
	"is_locked" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "search_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"database_name" text NOT NULL,
	"query_string" text NOT NULL,
	"result_count" integer,
	"executed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"theme" text DEFAULT 'light',
	"language" text DEFAULT 'en',
	"notifications_enabled" boolean DEFAULT true,
	"email_notifications" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "idx_articles_project_id" ON "articles" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_articles_status" ON "articles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_articles_screening_decision" ON "articles" USING btree ("screening_decision");