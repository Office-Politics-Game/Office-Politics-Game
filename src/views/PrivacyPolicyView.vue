<template>
  <main class="legal-page">
    <section class="legal-panel">
      <RouterLink class="legal-back-link" to="/">返回首頁</RouterLink>
      <h1>隱私權政策</h1>
      <p>
        Office Politics Game 會透過第三方平台登入
        取得使用者的公開個人資料與電子郵件地址，用於建立與登入遊戲帳號。
      </p>
      <h2>我們收集的資料</h2>
      <ul>
        <li>第三方登入平台提供的公開個人資料，例如顯示名稱、頭像</li>
        <li>電子郵件地址</li>
      </ul>
      <h2>資料用途</h2>
      <ul>
        <li>使用者登入與帳號識別</li>
        <li>顯示基本玩家資料</li>
      </ul>
      <p>
        我們不會販售使用者個人資料，也不會將資料用於第三方廣告。
      </p>
      <p>
        如需刪除資料，請依照
        <RouterLink to="/data-deletion">資料刪除說明頁</RouterLink>
        操作。
      </p>
    </section>
  </main>
</template>

<style scoped>
.legal-page {
  min-height: 100svh;
  overflow-y: auto;
  background: linear-gradient(180deg, #ffffff, #f4f7fb);
  padding: 32px 16px;
  color: var(--brand-navy);
}

.legal-panel {
  width: min(880px, 100%);
  margin: 0 auto;
  border: 1px solid var(--gray-100);
  background: rgba(255, 255, 255, 0.92);
  padding: 28px;
  box-shadow: var(--shadow);
}

.legal-back-link {
  display: inline-flex;
  margin-bottom: 24px;
  color: var(--brand-active);
  font-size: var(--text-sm);
  font-weight: 800;
  text-decoration: none;
}

h1 {
  margin: 0 0 20px;
  font-size: var(--text-xl);
  font-weight: 900;
}

h2 {
  margin: 28px 0 12px;
  font-size: var(--text-lg);
  font-weight: 900;
}

p,
li {
  font-size: var(--text-md);
  line-height: 1.8;
}

ul {
  margin: 0;
  padding-left: 24px;
}

a {
  color: var(--brand-hover);
  font-weight: 800;
}

@media (max-width: 760px) {
  .legal-page {
    padding: 16px 10px;
  }

  .legal-panel {
    padding: 20px 16px;
  }
}
</style>