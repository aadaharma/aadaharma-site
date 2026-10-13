CREATE TABLE "patterns" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"craft" text,
	"difficulty" text,
	"yarn_weight" text,
	"sizes" text,
	"yarn" text,
	"needles" text,
	"gauge" text,
	"notions" text,
	"cover_url" text,
	"cover_alt" text,
	"pdf_url" text,
	"body_md" text DEFAULT '' NOT NULL,
	"date" date,
	"draft" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "patterns_language_slug" ON "patterns" USING btree ("language","slug");