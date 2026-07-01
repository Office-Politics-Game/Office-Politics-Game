# 團隊開發規範

本文件是 Office Politics Game 專案的正式團隊開發規範。

## 技術棧

- Vue 3
- Tailwind CSS
- Pinia
- Vue Router

## 專案結構

```text
src/
├── assets/           # 圖片、圖示、字型與全域樣式
├── components/
│   ├── common/       # Button、Input、Modal 等通用元件
│   └── layout/       # Header、Sidebar、Footer 等版面元件
├── composables/      # 可複用 Vue 邏輯
├── constants/        # 常數定義
├── router/           # Vue Router 設定
├── services/         # API 請求封裝
├── stores/           # Pinia Store
├── types/            # TypeScript 型別
├── utils/            # 工具函式
├── views/            # 對應路由的頁面元件
├── App.vue
└── main.js / main.ts
```

## 命名規範

| 對象 | 規則 | 範例 |
| --- | --- | --- |
| 檔案名稱 | PascalCase | `UserProfile.vue`、`AuthStore.js` |
| 資料夾名稱 | kebab-case | `user-profile/`、`auth/` |
| 變數與函式 | camelCase | `userName`、`fetchUserData()` |
| 常數 | UPPER_SNAKE_CASE | `MAX_RETRY`、`API_BASE_URL` |

## 檔案位置

| 類型 | 存放位置 | 命名範例 |
| --- | --- | --- |
| 頁面元件 | `src/views/` | `HomeView.vue` |
| 通用元件 | `src/components/common/` | `BaseButton.vue` |
| 版面元件 | `src/components/layout/` | `AppHeader.vue` |
| 功能元件 | `src/components/<功能>/` | `UserCard.vue` |
| Pinia Store | `src/stores/` | `UserStore.js` |
| Router 設定 | `src/router/` | `index.js`、`Routes.js` |
| API 封裝 | `src/services/` | `UserService.js` |
| Composable | `src/composables/` | `UseAuth.js` |
| 工具函式 | `src/utils/` | `FormatDate.js` |
| 常數 | `src/constants/` | `RouteNames.js` |
| 型別 | `src/types/` | `UserTypes.ts` |
| 圖片 | `src/assets/images/` | `hero-banner.jpg` |
| SVG 圖示 | `src/assets/icons/` | `icon-user.svg` |
| 全域樣式 | `src/assets/styles/` | `main.css`、`variables.css` |

## Git 提交規範

提交訊息格式：

```text
<類型>(<範疇>): <簡短描述>
```

允許的類型：

| 類型 | 用途 |
| --- | --- |
| `feat` | 新增功能 |
| `fix` | 修復 Bug |
| `refactor` | 不影響功能的重構 |
| `style` | 樣式調整 |
| `docs` | 文件更新 |
| `chore` | 建置工具或依賴更新 |

範例：

```text
feat(user): 新增使用者個人資料頁面
fix(auth): 修復登入 Token 過期未跳轉問題
docs: 更新 README 安裝說明
```

## 執行原則

- 優先沿用現有架構與共用元件，不建立重複實作。
- 新檔案必須符合目錄與命名規範。
- 如需調整本規範，先提出討論並取得團隊共識。
- 不因其他任務順手修改無關檔案。
