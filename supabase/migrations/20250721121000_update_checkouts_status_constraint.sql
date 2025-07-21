-- checkouts.status の制約をTS型に合わせて修正
ALTER TABLE "public"."checkouts" DROP CONSTRAINT IF EXISTS "checkouts_status_check";
ALTER TABLE "public"."checkouts" ADD CONSTRAINT "checkouts_status_check" CHECK ((status = ANY (ARRAY['borrowed'::text, 'returned'::text])));
ALTER TABLE "public"."checkouts" VALIDATE CONSTRAINT "checkouts_status_check";
