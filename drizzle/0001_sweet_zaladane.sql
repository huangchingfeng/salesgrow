ALTER TYPE "public"."client_mood" ADD VALUE 'mixed';--> statement-breakpoint
CREATE TABLE "sales_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_title" varchar(100),
	"company_name" varchar(255),
	"company_description" text,
	"products_services" text,
	"industry" varchar(100),
	"target_audience" text,
	"unique_selling_points" text,
	"years_experience" integer,
	"communication_style" varchar(50),
	"personal_bio" text,
	"phone" varchar(50),
	"line_id" varchar(100),
	"linkedin_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "sales_profiles" ADD CONSTRAINT "sales_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;