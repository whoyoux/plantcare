CREATE TABLE "identify_attempt" (
	"id" bigserial PRIMARY KEY,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "identify_attempt_user_created_idx" ON "identify_attempt" ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "identify_attempt" ADD CONSTRAINT "identify_attempt_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;