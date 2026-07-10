## Context

`/profile` 目前在前端由 `authStore.currentPlayer`、`playerStore.currentPlayer`、`localStorage.guestPlayer` 與預設值組合顯示。正式會員登入與 token 驗證已經透過 Supabase Auth，遊戲玩家資料保存在 `players` 表。訪客登入會呼叫 `POST /api/players/guest` 建立 `players` 記錄，並將回傳資料保存為 `guestPlayer`。

這次變更橫跨 Express API、Supabase Auth 驗證、Postgres 玩家資料、Vue 頁面狀態與訪客鎖定 UI，因此需要明確的資料邊界與非目標，避免把 profile 編輯、schema migration 或公開玩家查詢一起帶入。

## Goals / Non-Goals

**Goals:**

- 正式會員進入 `/profile` 時，從後端 `GET /api/profile` 取得目前登入會員的 profile 資料。
- `/profile` 頁面資料、載入狀態、錯誤狀態與 refresh 行為集中在 `profileStore`，`authStore` 僅保留登入身份與 token 狀態。
- 訪客進入 `/profile` 時，顯示已建立的訪客基本資料，不呼叫會員 profile API。
- 訪客在對戰紀錄、成就、收藏與可編輯入口看到登入提示。
- 未登入且沒有訪客資料時，不顯示個人資料彈窗或預設假玩家。

**Non-Goals:**

- 不新增 `players` 欄位，不建立 migration。
- 不實作 profile 編輯或儲存 API。
- 不新增公開查詢任意玩家 profile 的 endpoint。
- 不改變 Supabase client 只在後端使用 service role 的既有模式。

## Decisions

### Use a dedicated member profile endpoint

新增 `GET /api/profile` 作為正式會員讀取 profile 的 API。此 endpoint 使用 Bearer token 驗證目前會員身分，回傳 profile DTO。選擇 dedicated endpoint 而不是擴充 `/api/auth/verify`，是因為 token 驗證與 profile 資料讀取有不同語意；後續若增加 profile 欄位或頁面載入策略，也不會讓 auth verify 承擔頁面資料契約。

替代方案是直接重用 `/api/auth/verify`。這會減少檔案數，但會把「驗證登入」與「讀取 profile 頁面資料」綁在一起，後續維護邊界較差。

### Keep Supabase access server-side

前端只呼叫既有 `apiClient` 管理的 Express API，不新增前端 Supabase client。後端沿用 Supabase Auth token 驗證，再用 `players.auth_user_id` 讀取資料。

替代方案是前端直接讀 Supabase。這需要公開 anon key、建立 RLS policy 與同步 client session，與目前專案的 Express API 架構不一致。

### Store profile page data in profileStore

新增 `profileStore` 作為 `/profile` 頁面的資料容器，管理 `profile`、`isLoading`、`errorMessage`、`loadedIdentityType` 與 `loadMemberProfile()`、`loadGuestProfile()`、`clearProfile()` 這類 actions。`authStore` 維持身份驗證責任，`playerStore` 維持訪客玩家身份來源；`profileStore` 負責把會員 API 資料或訪客資料轉成 profile 頁面可渲染的單一資料形狀。

替代方案是把完整 profile state 放進 `authStore.currentPlayer`。這會讓 auth store 同時管理身份、token、頁面載入狀態與 profile 展示資料，後續大廳或其他頁面共用身份資料時更容易出現責任混淆。另一個替代方案是只用 `ProfileView` local state；這會讓後續 profile refresh 或跨元件共用資料較難擴充。

### Use mixed guest locking on profile

`/profile` 不加 `requiresAuth` route guard。頁面內根據正式會員、訪客、匿名三種狀態切換：正式會員讀 API；訪客顯示基本資料並鎖定進階內容；匿名顯示登入/訪客提示。這延續 `/friend` 的頁面內登入提示模式，但保留 profile 對訪客的基本查看能力。

替代方案是完全比照 `/friend` 鎖定訪客。這會讓訪客無法查看自己剛建立的暱稱、頭像與玩家 ID，與目前 `/profile` 已支援訪客資料展示的使用情境不符。

### Read existing player fields only

profile DTO 僅回傳既有 `players` 欄位可支援的資料，例如 `id`、`username`、`avatarId`、`level`、`exp`、`winCount`、`loseCount`、`totalGames`、`createdAt`。`title`、`region`、`bio` 暫時由前端顯示「尚未設定」或非可儲存提示，且編輯按鈕不啟用儲存流程。

替代方案是新增欄位與編輯 API。這會把 schema migration、表單驗證與寫入權限放進本次 change，超出目前只串接讀取資料的目的。

## Implementation Contract

- API behavior: `GET /api/profile` requires `Authorization: Bearer <token>`。有效 token 且 `players` 有對應 `auth_user_id` 時回傳 `200 { profile }`；缺 token 或無效 token 回傳 `401 { message }`；找不到玩家資料回傳 `404 { message }`。
- API data shape: `profile` MUST include only page-safe player fields: `id`, `username`, `avatarId`, `level`, `exp`, `winCount`, `loseCount`, `totalGames`, `createdAt`, and currency fields already exposed by current player auth data if reused by UI. It MUST NOT include `account` or `authUserId`.
- Pinia state contract: `profileStore` owns the profile page's normalized display data and request state. `authStore` remains the source for member auth token and current identity, while `playerStore` remains the source for guest identity. `ProfileView` reads render-ready profile data and state from `profileStore` instead of rebuilding fake defaults locally.
- Frontend member behavior: when `authStore.isLoggedIn` and `authStore.token` are present, `/profile` loads `GET /api/profile`, renders only a simplified loading animation while pending, renders returned data on success, and surfaces an error state with retry and login actions only after the request fails.
- Frontend guest behavior: when there is no member token but `playerStore.currentPlayer` or `localStorage.guestPlayer` has an id, `/profile` renders guest basic data without calling `GET /api/profile`.
- Frontend anonymous behavior: when neither member nor guest identity exists, `/profile` does not render a profile modal, identity-required popup, or fake player values. The login guidance action is reserved for failed profile data requests.
- Locked content behavior: for guest users, tabs other than basic profile and any edit action render a login-required state similar in intent to the friend feature lock. The UI must not present a saveable edit form for guests.
- In scope: profile read endpoint, profile DTO mapping, profile page data loading, guest/anonymous states, locked tab/edit UI, and focused tests or scripts for these behaviors.
- Out of scope: database migration, profile editing, public player profile lookup, changes to friend behavior, and direct frontend Supabase access.
- Acceptance criteria: `npm run build` succeeds; backend tests covering profile auth response behavior are added or updated where the backend test harness supports them; manual or automated frontend checks confirm member, guest, and anonymous `/profile` states.

## Risks / Trade-offs

- [Risk] Existing UI expects `title`, `region`, and `bio`, but the database does not provide them. → Mitigation: render explicit unset/locked text and keep edit controls non-saveable until a later schema change.
- [Risk] Adding a dedicated endpoint duplicates part of auth token verification. → Mitigation: reuse existing auth verification service or middleware so token validation logic remains centralized.
- [Risk] Guest data in localStorage can be stale after the server changes. → Mitigation: keep guest profile read-only and limited to basic display for this change; server refresh for guests can be a later capability if needed.
