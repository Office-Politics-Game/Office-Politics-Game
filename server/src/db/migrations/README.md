# Database Migrations

此資料夾存放既有資料庫升級到新版結構所需的 SQL migration。

## 檔案用途

- `server/src/db/schema.sql`：最新完整資料庫結構，適合用於重建資料庫。
- `server/src/db/migrations/*.sql`：既有資料庫的升級步驟，適合用於本機、Supabase dev / production DB 同步。

## 命名規則

新增 migration 時使用日期加簡短描述：

```text
YYYYMMDD_簡短描述.sql
```

範例：

```text
20260703_create_room_invitations.sql
```

## 團隊規則

- 每次修改 `schema.sql` 時，原則上都要同步新增一支 migration。
- PR 若包含資料庫結構變更，需在 PR 說明標註要執行的 migration。
- Supabase 部署前，需依序執行尚未套用的 migration。
- migration SQL 應盡量使用 `IF NOT EXISTS` 或其他可重複執行的寫法，避免已套用過的環境重跑時失敗。
- 若既有資料庫結構已和 migration 預期不一致，另開 issue 處理資料庫校正，不在同一支 migration 中混入未知修補。
