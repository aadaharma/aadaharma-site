CREATE TABLE "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_en" text NOT NULL,
	"name_fi" text NOT NULL,
	"category" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"stitches" jsonb NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
