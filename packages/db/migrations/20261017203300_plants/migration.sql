CREATE TABLE "plant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"identification_id" uuid,
	"image_key" text NOT NULL,
	"name" text NOT NULL,
	"scientific_name" text,
	"watering_interval_days" integer NOT NULL,
	"last_watered_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plant_watering_interval_range" CHECK ("watering_interval_days" between 1 and 60)
);
--> statement-breakpoint
CREATE INDEX "plant_user_idx" ON "plant" ("user_id");--> statement-breakpoint
ALTER TABLE "plant" ADD CONSTRAINT "plant_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "plant" ADD CONSTRAINT "plant_identification_id_identification_id_fkey" FOREIGN KEY ("identification_id") REFERENCES "identification"("id") ON DELETE SET NULL;