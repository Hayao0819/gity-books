-- checkout_book関数の曖昧なカラム参照をテーブル名で修飾して解消
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
declare
    v_id integer;
    v_book_id integer;
    v_user_id integer;
    v_checkout_date timestamptz;
    v_due_date timestamptz;
    v_return_date timestamptz;
    v_status text;
    v_created_at timestamptz;
    v_updated_at timestamptz;
begin
    -- 本の状態を確認
    if exists (select 1 from books where books.id = p_book_id and books.status = 'available' and books.deleted_at is null) then
        -- 本の状態を"borrowed"に更新
        update books set status = 'borrowed', updated_at = now() where books.id = p_book_id;
        -- チェックアウトレコードを作成
        insert into checkouts (book_id, user_id, due_date, status, checkout_date, created_at, updated_at)
        values (p_book_id, p_user_id, p_due_date, 'borrowed', now(), now(), now())
        returning checkouts.id, checkouts.book_id, checkouts.user_id, checkouts.checkout_date, checkouts.due_date, checkouts.return_date, checkouts.status, checkouts.created_at, checkouts.updated_at
        into v_id, v_book_id, v_user_id, v_checkout_date, v_due_date, v_return_date, v_status, v_created_at, v_updated_at;
        id := v_id;
        book_id := v_book_id;
        user_id := v_user_id;
        checkout_date := v_checkout_date;
        due_date := v_due_date;
        return_date := v_return_date;
        status := v_status;
        created_at := v_created_at;
        updated_at := v_updated_at;
        return next;
    else
        raise exception 'Book is not available';
    end if;
end;
$$ language plpgsql security definer;
