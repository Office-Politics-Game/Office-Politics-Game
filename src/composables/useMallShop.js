import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  mallCategoryThemeMap,
  mallFeaturedBannerByCategory,
  mallFeaturedBannerTitleByCategory,
  mallTopUpItems,
} from "@/constants/MallConfig.js";
import { mallCategories, mallItems } from "@/mocks/mallMockData.js";
import {
  getPlayerShopItems,
  getShopItems,
  purchaseShopItem,
} from "@/services/shopApi.js";
import {
  formatNumber,
  getCurrencyBalance,
  getOwnedShopItemIdSet,
  normalizeShopItem,
  shopTypeCategoryMap,
} from "@/services/shopItemMapper.js";
import { createEcpayCheckout, createTopUpOrder } from "@/services/topUpApi.js";
import { useAuthStore } from "@/stores/authStore.js";
import { useCurrencyStore } from "@/stores/currencyStore.js";
import { usePlayerStore } from "@/stores/playerStore.js";

function getStoredGuestPlayer() {
  if (typeof localStorage === "undefined") {
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem("guestPlayer") || "null");
  } catch {
    return null;
  }
}

function getErrorMessage(error, fallbackMessage) {
  return error?.data?.message || error?.message || fallbackMessage;
}

function submitEcpayForm(checkout) {
  const form = document.createElement("form");

  form.method = "POST";
  form.action = checkout.actionUrl;
  form.target = "_blank";

  Object.entries(checkout.params).forEach(([name, value]) => {
    const input = document.createElement("input");

    input.type = "hidden";
    input.name = name;
    input.value = value;

    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

export function useMallShop() {
  const route = useRoute();
  const authStore = useAuthStore();
  const currencyStore = useCurrencyStore();
  const playerStore = usePlayerStore();
  const categories = mallCategories;
  const fallbackItems = mallItems;

  const shopItems = ref([]);
  const playerItems = ref([]);
  const isShopLoading = ref(false);
  const isPurchasing = ref(false);
  const statusMessage = ref("");
  const activeCategory = ref(categories[0].id);
  const selectedItem = ref(null);
  const isDetailModalOpen = ref(false);
  const isImagePreviewOpen = ref(false);

  const currentPlayerId = computed(() => {
    const routePlayerId = Number(route.query.playerId);

    if (Number.isInteger(routePlayerId) && routePlayerId > 0) {
      return routePlayerId;
    }

    const storedGuestPlayer = getStoredGuestPlayer();

    return (
      authStore.currentPlayer?.id ??
      playerStore.currentPlayerId ??
      storedGuestPlayer?.id ??
      null
    );
  });

  const fallbackImageByCategory = computed(() =>
    fallbackItems.reduce((accumulator, item) => {
      if (!accumulator[item.category]) {
        accumulator[item.category] = item.previewImage;
      }

      return accumulator;
    }, {}),
  );

  const ownedShopItemIds = computed(() =>
    getOwnedShopItemIdSet(playerItems.value),
  );

  const normalizedItems = computed(() => [
    ...shopItems.value.map((item) => {
      const category = shopTypeCategoryMap[item.type];

      return normalizeShopItem(item, {
        categories,
        fallbackImage:
          fallbackImageByCategory.value[category] ??
          fallbackItems[0]?.previewImage,
        ownedShopItemIds: ownedShopItemIds.value,
      });
    }),
    ...mallTopUpItems,
  ]);

  const categoriesWithCount = computed(() =>
    categories.map((category) => ({
      ...category,
      style:
        mallCategoryThemeMap[category.id] ??
        mallCategoryThemeMap["card-front"],
      count: normalizedItems.value.filter(
        (item) => item.category === category.id,
      ).length,
    })),
  );

  const filteredItems = computed(() =>
    normalizedItems.value.filter(
      (item) => item.category === activeCategory.value,
    ),
  );

  const activeCategoryMeta = computed(
    () =>
      categoriesWithCount.value.find(
        (category) => category.id === activeCategory.value,
      ) ?? categoriesWithCount.value[0],
  );

  const featuredBannerImage = computed(
    () => mallFeaturedBannerByCategory[activeCategory.value] ?? null,
  );

  const featuredBannerTitle = computed(
    () => mallFeaturedBannerTitleByCategory[activeCategory.value] ?? "",
  );

  const budgetDisplay = computed(() =>
    formatNumber(
      getCurrencyBalance(selectedItem.value?.currency ?? "coin", {
        coins: currencyStore.coins,
        gems: currencyStore.gems,
        tickets: currencyStore.tickets,
      }),
    ),
  );

  async function loadShopData() {
    const playerId = currentPlayerId.value;

    isShopLoading.value = true;
    statusMessage.value = "";

    try {
      const [shopData, ownedData] = await Promise.all([
        getShopItems({ activeOnly: true }),
        playerId ? getPlayerShopItems(playerId) : Promise.resolve({ items: [] }),
        playerId
          ? currencyStore.fetchPlayerCurrency(playerId)
          : Promise.resolve(null),
      ]);

      shopItems.value = shopData.items ?? [];
      playerItems.value = ownedData.items ?? [];

      if (!playerId) {
        statusMessage.value = "尚未取得玩家 ID，商品可瀏覽但無法購買。";
      }
    } catch (error) {
      statusMessage.value = getErrorMessage(
        error,
        "商城資料載入失敗，請稍後再試。",
      );
      shopItems.value = [];
      playerItems.value = [];
    } finally {
      isShopLoading.value = false;
    }
  }

  function openItemDetail(item) {
    selectedItem.value = item;
    isDetailModalOpen.value = true;
  }

  function closeItemDetail() {
    isDetailModalOpen.value = false;
    isImagePreviewOpen.value = false;
  }

  function openImagePreview() {
    isImagePreviewOpen.value = true;
  }

  function closeImagePreview() {
    isImagePreviewOpen.value = false;
  }

  async function purchaseItem(item) {
    if (item.category === "top-up") {
      if (!currentPlayerId.value) {
        statusMessage.value = "尚未取得玩家 ID，請重新登入後再購買股份。";
        return;
      }

      isPurchasing.value = true;
      statusMessage.value = "";

      try {
        const orderResult = await createTopUpOrder({
          playerId: currentPlayerId.value,
          packageId: item.id,
        });
        const checkoutResult = await createEcpayCheckout(orderResult.order.id);

        submitEcpayForm(checkoutResult.checkout);
      } catch (error) {
        statusMessage.value = getErrorMessage(
          error,
          "建立儲值訂單失敗，請稍後再試。",
        );
      } finally {
        isPurchasing.value = false;
      }

      return;
    }

    if (!currentPlayerId.value) {
      statusMessage.value = "尚未取得玩家 ID，請重新登入後再購買商品。";
      return;
    }

    if (item.actionState !== "buy" || isPurchasing.value) {
      return;
    }

    isPurchasing.value = true;
    statusMessage.value = "";

    try {
      const result = await purchaseShopItem({
        playerId: currentPlayerId.value,
        shopItemId: item.id,
        quantity: 1,
      });

      if (result.currency) {
        currencyStore.coins = result.currency.coins ?? currencyStore.coins;
        currencyStore.gems = result.currency.gems ?? currencyStore.gems;
        currencyStore.tickets =
          result.currency.tickets ?? currencyStore.tickets;
      }

      await Promise.all([
        getPlayerShopItems(currentPlayerId.value).then((data) => {
          playerItems.value = data.items ?? [];
        }),
        getShopItems({ activeOnly: true }).then((data) => {
          shopItems.value = data.items ?? [];
        }),
      ]);

      statusMessage.value = "購買成功，已更新持有狀態與貨幣餘額。";
    } catch (error) {
      statusMessage.value = getErrorMessage(
        error,
        "購買失敗，請檢查餘額或稍後再試。",
      );
    } finally {
      isPurchasing.value = false;
    }
  }

  function purchaseSelectedItem() {
    if (selectedItem.value) {
      purchaseItem(selectedItem.value);
    }
  }

  watch(
    filteredItems,
    (nextItems) => {
      if (!nextItems.length) {
        isDetailModalOpen.value = false;
        return;
      }

      const nextSelectedItem = nextItems.find(
        (item) => item.id === selectedItem.value?.id,
      );

      selectedItem.value = nextSelectedItem ?? nextItems[0];
    },
    { immediate: true },
  );

  watch(currentPlayerId, loadShopData, { immediate: true });

  return {
    activeCategory,
    activeCategoryMeta,
    budgetDisplay,
    categoriesWithCount,
    closeImagePreview,
    closeItemDetail,
    featuredBannerImage,
    featuredBannerTitle,
    filteredItems,
    isDetailModalOpen,
    isImagePreviewOpen,
    isPurchasing,
    isShopLoading,
    openImagePreview,
    openItemDetail,
    purchaseItem,
    purchaseSelectedItem,
    selectedItem,
    statusMessage,
  };
}
