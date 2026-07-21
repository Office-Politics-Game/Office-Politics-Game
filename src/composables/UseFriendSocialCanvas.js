import { computed, onMounted, onUnmounted, ref } from "vue";

const COMPACT_CANVAS = Object.freeze({
  mode: "compact",
  designWidth: 960,
  designHeight: 540,
  panelWidth: 920,
  panelHeight: 520,
  leftColumnWidth: 340,
  rightColumnWidth: 580,
});

const STANDARD_CANVAS = Object.freeze({
  mode: "standard",
  designWidth: 1280,
  designHeight: 720,
  panelWidth: 1180,
  panelHeight: 688,
  leftColumnWidth: 420,
  rightColumnWidth: 760,
});

function normalizeViewportDimension(value) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function resolveFriendSocialCanvas(viewportWidth, viewportHeight) {
  const normalizedWidth = normalizeViewportDimension(viewportWidth);
  const normalizedHeight = normalizeViewportDimension(viewportHeight);
  const preset =
    normalizedWidth < 1024 ? COMPACT_CANVAS : STANDARD_CANVAS;
  const scale = Math.min(
    normalizedWidth / preset.designWidth,
    normalizedHeight / preset.designHeight,
    1,
  );

  return {
    ...preset,
    scale,
    scaledWidth: preset.designWidth * scale,
    scaledHeight: preset.designHeight * scale,
  };
}

function readViewport() {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function useFriendSocialCanvas() {
  const viewport = ref(readViewport());

  const canvas = computed(() =>
    resolveFriendSocialCanvas(viewport.value.width, viewport.value.height),
  );

  const frameStyle = computed(() => ({
    width: `${canvas.value.scaledWidth}px`,
    height: `${canvas.value.scaledHeight}px`,
  }));

  const canvasStyle = computed(() => ({
    width: `${canvas.value.designWidth}px`,
    height: `${canvas.value.designHeight}px`,
    transform: `scale(${canvas.value.scale})`,
    transformOrigin: "top left",
  }));

  const panelStyle = computed(() => ({
    "--friend-panel-width": `${canvas.value.panelWidth}px`,
    "--friend-panel-height": `${canvas.value.panelHeight}px`,
    "--friend-left-column-width": `${canvas.value.leftColumnWidth}px`,
    "--friend-right-column-width": `${canvas.value.rightColumnWidth}px`,
  }));

  function refreshViewport() {
    viewport.value = readViewport();
  }

  onMounted(() => {
    refreshViewport();
    window.addEventListener("resize", refreshViewport, { passive: true });
  });

  onUnmounted(() => {
    window.removeEventListener("resize", refreshViewport);
  });

  return {
    canvas,
    frameStyle,
    canvasStyle,
    panelStyle,
    refreshViewport,
  };
}
