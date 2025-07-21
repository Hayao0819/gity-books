-- books.status の制約をTS型に合わせて修正
ALTER TABLE "public"."books" DROP CONSTRAINT IF EXISTS "books_status_check";
ALTER TABLE "public"."books" ADD CONSTRAINT "books_status_check" CHECK ((status = ANY (ARRAY['available'::text, 'borrowed'::text])));
ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_status_check";
