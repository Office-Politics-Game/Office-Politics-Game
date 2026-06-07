<template>
  <div class="modal">
    <!-- Close Button -->
    <button class="modalClose">✕</button>

    <!-- Title -->
    <h2 class="modalTitle">登入</h2>

    <!-- Username Field -->
    <div class="field">
      <input
        class="fieldInput"
        type="text"
        placeholder="帳號"
        value=""
      />
      <div class="fieldActions">
        <button class="fieldIconBtn">✕</button>
        <button class="fieldIconBtn">▾</button>
      </div>
    </div>

    <!-- Password Field -->
    <div class="field">
      <input
        class="fieldInput"
        type="password"
        placeholder="密碼"
      />
    </div>

    <!-- Action Buttons -->
<div class="modalBtnRow">
      <button class="btn btnRegister">註冊</button>
      <button class="btn btnLogin">登入</button>
    </div>

    <!-- Text Links -->
    <div class="modalLinkRow">
      <button class="linkBtn">遊客登入 <span class="linkBtnArrow">›</span></button>
      <button class="linkBtn">取回密碼 <span class="linkBtnArrow">›</span></button>
    </div>

    <!-- Divider -->
    <div class="divider">其他登入方式</div>

    <!-- Social Buttons -->
    <div class="modalSocialRow">
      <button class="socialBtn">
        <span class="socialBtnFbIcon">f</span>
        Facebook
      </button>
      <button class="socialBtn">
        <svg class="socialBtnGoogleIcon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google
      </button>
    </div>
  </div>
</template>

<script setup>
// 純切版，無邏輯
</script>

<style scoped>
/* ── Modal Shell ── */
.modal {
  position: relative;
  background: rgba(255, 255, 255, 0.97);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(200, 168, 75, 0.2);
  width: 100%;
  max-width: 420px;
  padding: 36px 32px 32px;
  animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.modal::before {
  content: '';
  position: absolute;
  top: 0; left: 32px; right: 32px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-gold), transparent);
  border-radius: 2px;
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.88) translateY(20px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* ── Close ── */
.modalClose {
  position: absolute; top: 14px; right: 14px;
  width: 34px; height: 34px; border-radius: 50%;
  background: #ccc; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 16px; font-weight: bold;
}

/* ── Title ── */
.modalTitle {
  text-align: center;
  font-size: 26px;
  font-weight: 700;
  color: var(--color-sky);
  letter-spacing: 0.25em;
  margin-bottom: 28px;
}

/* ── Field ── */
.field {
  position: relative;
  margin-bottom: 14px;
}
.fieldInput {
  width: 100%;
  background: var(--color-gray-bg);
  border: 1.5px solid var(--color-gray-border);
  border-radius: var(--radius-md);
  padding: 14px 84px 14px 16px;
  font-size: 16px;
  font-family: var(--font-body);
  color: var(--color-text-dark);
  outline: none;
}
.fieldInput::placeholder { color: #bbb; }

.fieldActions {
  position: absolute; right: 10px; top: 50%;
  transform: translateY(-50%);
  display: flex; gap: 6px; align-items: center;
}
.fieldIconBtn {
  background: none; border: none; cursor: pointer;
  color: #aaa; font-size: 17px; padding: 4px;
  display: flex; align-items: center;
}

/* ── Buttons ── */
.modalBtnRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
}
.btn {
  border-radius: var(--radius-md);
  padding: 14px 0;
  font-size: 18px;
  font-family: var(--font-body);
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.18em;
  border: none;
}
.btnRegister {
  background: #fff;
  border: 2px solid var(--color-sky);
  color: var(--color-sky);
}
.btnLogin {
  background: linear-gradient(135deg, var(--color-sky), var(--color-sky-dark));
  color: #fff;
  box-shadow: 0 4px 20px rgba(58, 143, 181, 0.45);
}

/* ── Link Row ── */
.modalLinkRow {
  display: flex;
  justify-content: space-between;
  margin-top: 18px;
}
.linkBtn {
  background: none; border: none; cursor: pointer;
  color: var(--color-text-mid); font-size: 14px;
  font-family: var(--font-body);
  display: flex; align-items: center; gap: 4px;
  padding: 4px 0;
}
.linkBtnArrow { font-size: 12px; }

/* ── Divider ── */
.divider {
  text-align: center;
  color: var(--color-text-mid);
  font-size: 13px;
  margin: 22px 0 16px;
  position: relative;
}
.divider::before, .divider::after {
  content: '';
  position: absolute; top: 50%;
  width: 28%; height: 1px;
  background: var(--color-gray-border);
}
.divider::before { left: 0; }
.divider::after  { right: 0; }

/* ── Social ── */
.modalSocialRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.socialBtn {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  border: 1.5px solid var(--color-gray-border);
  border-radius: var(--radius-md);
  padding: 12px 0;
  background: #fff;
  cursor: pointer;
  font-size: 15px;
  font-family: var(--font-body);
  color: var(--color-text-dark);
  font-weight: 500;
}
.socialBtnFbIcon {
  width: 24px; height: 24px; border-radius: 50%;
  background: #1877f2;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 14px; font-weight: bold;
  font-family: Georgia, serif;
  flex-shrink: 0;
}
.socialBtnGoogleIcon {
  width: 24px; height: 24px;
  flex-shrink: 0;
}
</style>
