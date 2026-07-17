<template>
  <main class="legal-page">
    <section class="legal-panel">
      <RouterLink class="legal-back-link" to="/">返回首頁</RouterLink>
      <h1>使用者資料刪除說明</h1>
      <p>
        如果你想刪除 Office Politics Game 中透過第三方平台登入
        建立的帳號資料，請寄信到：
      </p>
      <p class="legal-email">officepoliticsgame@gmail.com</p>
      <p>
        信件標題請填寫：
        <strong>刪除 Office Politics Game 帳號資料</strong>
      </p>
      <p>
        我們收到申請後，會刪除與該第三方平台登入帳號相關的遊戲帳號資料。
      </p>
      <p>
        你也可以先回到
        <RouterLink to="/privacy">隱私權政策</RouterLink>
        查看資料使用說明。
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

p {
  font-size: var(--text-md);
  line-height: 1.8;
}

.legal-email {
  border: 1px solid var(--gray-100);
  background: #f4f7fb;
  padding: 12px 14px;
  font-weight: 900;
  word-break: break-all;
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