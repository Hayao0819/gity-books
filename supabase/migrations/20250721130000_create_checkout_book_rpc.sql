-- 本の貸出処理をトランザクションで行うRPC
-- 引数: p_book_id, p_user_id, p_due_date
-- 戻り値: 新規作成されたチェックアウトレコード

create or replace function checkout_book(
    p_book_id integer,
    p_user_id integer,
    p_due_date timestamptz
)
returns table (
    id integer,
    book_id integer,
    user_id integer,
    checkout_date timestamptz,
    due_date timestamptz,
    return_date timestamptz,
    status text,
    created_at timestamptz,
    updated_at timestamptz
) as $$
begin
    -- 本の状態を確認
    if exists (select 1 from books where id = p_book_id and status = 'available' and deleted_at is null) then
        -- 本の状態を"borrowed"に更新
        update books set status = 'borrowed', updated_at = now() where id = p_book_id;
        -- チェックアウトレコードを作成
        insert into checkouts (book_id, user_id, due_date, status, checkout_date, created_at, updated_at)
        values (p_book_id, p_user_id, p_due_date, 'borrowed', now(), now(), now())
        returning id, book_id, user_id, checkout_date, due_date, return_date, status, created_at, updated_at into id, book_id, user_id, checkout_date, due_date, return_date, status, created_at, updated_at;
        return next;
    else
        raise exception 'Book is not available';
    end if;
end;
$$ language plpgsql security definer;
