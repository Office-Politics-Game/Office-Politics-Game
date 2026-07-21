import beachStyleBackground from "@/assets/images/beach-style-bg.webp";
import jpStyleBackground from "@/assets/images/jp-style-bg.webp";
import legoStyleBackground from "@/assets/images/lego-style-bg.webp";
import stockToken from "@/assets/images/stock-token.webp";
import stockTokenBundle from "@/assets/images/stock-token-bundle.webp";
import stockTokenStack from "@/assets/images/stock-token-stack.webp";

export const mallFeaturedBannerByCategory = {
  "card-front": beachStyleBackground,
  "card-back": jpStyleBackground,
  board: legoStyleBackground,
};

export const mallFeaturedBannerTitleByCategory = {
  "card-front": "海灘風格卡面",
  "card-back": "浮世繪風格卡背",
  board: "樂高風格盤面",
};

export const mallCategoryThemeMap = {
  "card-front": {
    "--category-accent": "34 211 238",
    "--category-accent-strong": "14 165 233",
    "--category-bg": "8 47 73",
  },
  "card-back": {
    "--category-accent": "168 85 247",
    "--category-accent-strong": "126 34 206",
    "--category-bg": "59 7 100",
  },
  ticket: {
    "--category-accent": "251 191 36",
    "--category-accent-strong": "217 119 6",
    "--category-bg": "69 26 3",
  },
  board: {
    "--category-accent": "52 211 153",
    "--category-accent-strong": "5 150 105",
    "--category-bg": "6 78 59",
  },
  avatar: {
    "--category-accent": "244 114 182",
    "--category-accent-strong": "219 39 119",
    "--category-bg": "80 7 36",
  },
  "top-up": {
    "--category-accent": "129 140 248",
    "--category-accent-strong": "79 70 229",
    "--category-bg": "49 46 129",
  },
};

export const mallTopUpItems = [
  {
    id: "gems_60",
    category: "top-up",
    categoryLabel: "購買股份",
    name: "60 股份",
    description: "小額股份方案，適合先試用儲值流程。",
    summary: "取得 60 股份。",
    price: "NT$ 30",
    rawPrice: 30,
    currency: "diamond",
    actionLabel: "前往儲值",
    actionState: "buy",
    previewImage: stockToken,
    previewImageClass: "item-card__preview-image--stock-single",
  },
  {
    id: "gems_300",
    category: "top-up",
    categoryLabel: "購買股份",
    name: "300 股份",
    description: "標準股份方案，取得更多商城可用股份。",
    summary: "取得 300 股份。",
    price: "NT$ 150",
    rawPrice: 150,
    currency: "diamond",
    actionLabel: "前往儲值",
    actionState: "buy",
    previewImage: stockTokenStack,
    previewImageClass: "item-card__preview-image--stock-stack",
  },
  {
    id: "gems_680",
    category: "top-up",
    categoryLabel: "購買股份",
    name: "680 股份",
    description: "大量股份方案，適合一次補足商城購買額度。",
    summary: "取得 680 股份。",
    price: "NT$ 330",
    rawPrice: 330,
    currency: "diamond",
    actionLabel: "前往儲值",
    actionState: "buy",
    previewImage: stockTokenBundle,
    previewImageClass: "item-card__preview-image--stock-bundle",
  },
];
