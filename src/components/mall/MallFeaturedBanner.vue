<template>
  <article
    class="featured-panel overflow-hidden border border-slate-300/80 bg-slate-950 text-white"
  >
    <div class="featured-banner">
      <img :src="image" :alt="alt" class="featured-banner__image" />
      <div class="featured-banner__caption">
        <div>
          <div class="featured-banner__eyebrow">精選推薦</div>
          <h2>{{ title }}</h2>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
defineProps({
  image: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.featured-panel {
  border-color: rgba(0, 70, 244, 0.28);
  background: rgba(2, 6, 23, 0.96);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 18px 34px rgba(0, 0, 0, 0.32);
}

.featured-banner {
  position: relative;
  aspect-ratio: 5 / 1;
  overflow: hidden;
  background: var(--brand-navy);
}

.featured-banner__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.featured-banner__caption {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 10px 12px;
  background: linear-gradient(
    90deg,
    rgba(0, 19, 50, 0.9) 0%,
    rgba(0, 19, 50, 0.58) 28%,
    transparent 50%
  );
}

.featured-banner__eyebrow {
  color: white;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-shadow: 0 2px 6px rgba(0, 19, 50, 0.42);
}

.featured-banner h2 {
  margin: 3px 0 0;
  color: white;
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: 700;
  line-height: 1.2;
  text-shadow: 0 2px 8px rgba(0, 19, 50, 0.48);
}

@media (max-width: 1279px) {
  .featured-panel {
    display: none;
  }
}
</style>
