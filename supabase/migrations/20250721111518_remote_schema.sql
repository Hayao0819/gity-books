alter table "public"."books" drop constraint "books_status_check";

alter table "public"."books" add constraint "books_status_check" CHECK ((status = ANY (ARRAY['available'::text, 'checked_out'::text, 'reserved'::text, 'maintenance'::text]))) not valid;

alter table "public"."books" validate constraint "books_status_check";


