import { resolveImageAssetUrl } from "@/utils/assetUrlResolver.js";

function createTheme({ key, aliases = [], logoUrl, slotImages, slotFrames = {} }) {
  return {
    key,
    aliases: [key, `${key}-style`, ...aliases],
    logoUrl,
    slotImages,
    slotFrames,
  };
}

const CARD_SKIN_THEMES = {
  "neon-hustle": createTheme({
    key: "neon-hustle",
    aliases: ["neon", "neon hustle"],
    logoUrl:
      "https://res.cloudinary.com/pumy6qez/image/upload/v1784016263/neon-hustle-logo_b501by.webp",
    slotImages: {
      intern:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016263/neon-hustle-intern-card-skin_u60nqb.webp",
      cleaner:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016258/neon-hustle-cleaner-card-skin_jvpmzr.webp",
      manager:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016265/neon-hustle-manager-card-skin_qrv1ux.webp",
      senior:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016267/neon-hustle-senior-card-skin_xjclpy.webp",
      pm: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016267/neon-hustle-pm-card-skin_ttm08p.webp",
      hr: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016261/neon-hustle-hr-card-skin_url3mq.webp",
      advisor:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016255/neon-hustle-advisor-card-skin_cawikq.webp",
      ceo: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016257/neon-hustle-ceo-card-skin_of3tr9.webp",
    },
    slotFrames: {
      intern:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016262/neon-hustle-intern-card-frame_iybaws.webp",
      cleaner:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016259/neon-hustle-cleaner-card-frame_qlodkk.webp",
      manager:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016264/neon-hustle-manager-card-frame_fcj7dx.webp",
      senior:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016269/neon-hustle-senior-card-frame_hlfiws.webp",
      pm: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016266/neon-hustle-pm-card-frame_k1x9p1.webp",
      hr: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016260/neon-hustle-hr-card-frame_sisrpj.webp",
      advisor:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016255/neon-hustle-advisor-card-frame_uaonuk.webp",
      ceo: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016256/neon-hustle-ceo-card-frame_zur9o8.webp",
    },
  }),
  beach: createTheme({
    key: "beach",
    aliases: ["summer", "beach style"],
    logoUrl:
      "https://res.cloudinary.com/pumy6qez/image/upload/v1784016287/beach-theme_ywkoql.webp",
    slotImages: {
      intern:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016284/beach-intern-card-skin_g23cpb.webp",
      cleaner:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016283/beach-cleaner-card-skin_b2jxul.webp",
      manager:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016285/beach-manager-card-skin_h8sojv.webp",
      senior:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016286/beach-senior-card-skin_olmalh.webp",
      pm: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016286/beach-pm-card-skin_busnom.webp",
      hr: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016284/beach-hr-card-skin_z5rvue.webp",
      advisor:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016281/beach-advisor-card-skin_cb68uh.webp",
      ceo: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016283/beach-ceo-card-skin_cbhipi.webp",
    },
  }),
  lego: createTheme({
    key: "lego",
    aliases: ["brick", "lego style"],
    logoUrl:
      "https://res.cloudinary.com/pumy6qez/image/upload/v1784016297/lego-theme_dvagkh.webp",
    slotImages: {
      intern:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016294/lego-intern-card-skin_yeap7f.webp",
      cleaner:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016291/lego-cleaner-card-skin_ko1tbt.webp",
      manager:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016295/lego-manager-card-skin_wkq4hg.webp",
      senior:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016298/lego-senior-card-skin_auanea.webp",
      pm: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016297/lego-pm-card-skin_is3lyw.webp",
      hr: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016293/lego-hr-card-skin_wir4jw.webp",
      advisor:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016288/lego-advisor-card-skin_r7dqww.webp",
      ceo: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016290/lego-ceo-card-skin_msw96k.webp",
    },
    slotFrames: {
      intern:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016293/lego-intern-card-frame_ejahmh.webp",
      cleaner:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016291/lego-cleaner-card-frame_k2l66z.webp",
      manager:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016294/lego-manager-card-frame_nhuarb.webp",
      senior:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016296/lego-senior-card-frame_axweus.webp",
      pm: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016296/lego-pm-card-frame_hlsid9.webp",
      hr: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016292/lego-hr-card-frame_qofkeq.webp",
      advisor:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016288/lego-advisor-card-frame_y52pim.webp",
      ceo: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016289/lego-ceo-card-frame_nmieox.webp",
    },
  }),
  mario: createTheme({
    key: "mario",
    aliases: ["super mario", "mario style"],
    logoUrl:
      "https://res.cloudinary.com/pumy6qez/image/upload/v1784016303/mario-logo_qfepem.webp",
    slotImages: {
      intern:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016303/mario-intern-card-skin_kulkw3.webp",
      cleaner:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016301/mario-cleaner-card-skin_i3vzpb.webp",
      manager:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016304/mario-manager-card-skin_rlhde0.webp",
      senior:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016305/mario-senior-card-skin_unhsle.webp",
      pm: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016305/mario-pm-card-skin_uqxptg.webp",
      hr: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016302/mario-hr-card-skin_vu12v1.webp",
      advisor:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016299/mario-advisor-card-skin_u17bec.webp",
      ceo: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016301/mario-ceo-card-skin_aiwvlh.webp",
    },
  }),
  ukiyo: createTheme({
    key: "ukiyo",
    aliases: ["ukiyo-e", "japanese", "ukiyo style"],
    logoUrl:
      "https://res.cloudinary.com/pumy6qez/image/upload/v1784016280/ukiyo-theme_votrri.webp",
    slotImages: {
      intern:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016276/ukiyo-intern-card-skin_sqiub6.webp",
      cleaner:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016274/ukiyo-cleaner-card-skin_kdrqlm.webp",
      manager:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016277/ukiyo-manager-card-skin_dgawbz.webp",
      senior:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016279/ukiyo-senior-card-skin_sluqdx.webp",
      pm: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016278/ukiyo-pm-card-skin_wlucwq.webp",
      hr: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016275/ukiyo-hr-card-skin_og7lfb.webp",
      advisor:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016268/ukiyo-advisor-card-skin_nbrud7.webp",
      ceo: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016272/ukiyo-ceo-card-skin_m9micp.webp",
    },
    slotFrames: {
      intern:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016275/ukiyo-intern-card-frame_r8biha.webp",
      cleaner:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016273/ukiyo-cleaner-card-frame_rizezl.webp",
      manager:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016276/ukiyo-manager-card-frame_ikksh7.webp",
      senior:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016279/ukiyo-senior-card-frame_pl7lrh.webp",
      pm: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016278/ukiyo-pm-card-frame_yafg7e.webp",
      hr: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016274/ukiyo-hr-card-frame_o7j9oq.webp",
      advisor:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784016269/ukiyo-advisor-card-frame_okxsq6.webp",
      ceo: "https://res.cloudinary.com/pumy6qez/image/upload/v1784016272/ukiyo-ceo-card-frame_dpnmdz.webp",
    },
  }),
  minimal: createTheme({
    key: "minimal",
    aliases: ["minimalism", "minimal style", "minimalist", "極簡", "極簡風格"],
    logoUrl:
      "https://res.cloudinary.com/pumy6qez/image/upload/v1784183647/minimal-theme_rgsrbq.png",
    slotImages: {
      intern:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784183635/minimal-intern-card-skin_l59hj4.webp",
      cleaner:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784183635/minimal-cleaner-card-skin_vpxiks.webp",
      manager:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784183635/minimal-manager-card-skin_dcos9e.webp",
      senior:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784183636/minimal-senior-card-skin_malud3.webp",
      pm: "https://res.cloudinary.com/pumy6qez/image/upload/v1784183636/minimal-pm-card-skin_z1dicy.webp",
      hr: "https://res.cloudinary.com/pumy6qez/image/upload/v1784183635/minimal-hr-card-skin_s6zdl5.webp",
      advisor:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784183635/minimal-advisor-card-skin_glgwtt.webp",
      ceo: "https://res.cloudinary.com/pumy6qez/image/upload/v1784183635/minimal-ceo-card-skin_zfw1zi.webp",
    },
    slotFrames: {
      intern:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784183673/minimal-intern-card-frame_j0td70.webp",
      cleaner:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784183670/minimal-cleaner-card-frame_bfed5u.webp",
      manager:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784183666/minimal-manager-card-frame_wbcrcy.webp",
      senior:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784183667/minimal-senior-card-frame_gfc1fs.webp",
      pm: "https://res.cloudinary.com/pumy6qez/image/upload/v1784183667/minimal-pm-card-frame_rfinwd.webp",
      hr: "https://res.cloudinary.com/pumy6qez/image/upload/v1784183672/minimal-hr-card-frame_f9t88q.webp",
      advisor:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784183668/minimal-advisor-card-frame_f6je1v.webp",
      ceo: "https://res.cloudinary.com/pumy6qez/image/upload/v1784183669/minimal-ceo-card-frame_t8esvi.webp",
    },
  }),
  "pixel-office": createTheme({
    key: "pixel-office",
    aliases: ["pixel", "pixel office", "pixel style", "8-bit", "像素", "像素風格"],
    logoUrl:
      "https://res.cloudinary.com/pumy6qez/image/upload/v1784184978/pixel-office-theme_bmgbne.webp",
    slotImages: {
      intern:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784184945/pixel-office-intern-card-skin_kuhj6i.webp",
      cleaner:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784184943/pixel-office-cleaner-card-skin_jr8wrz.webp",
      manager:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784184972/pixel-office-manager-card-skin_mnpdto.webp",
      senior:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784184976/pixel-office-senior-card-skin_jtsnlm.webp",
      pm: "https://res.cloudinary.com/pumy6qez/image/upload/v1784184974/pixel-office-pm-card-skin_my2emn.webp",
      hr: "https://res.cloudinary.com/pumy6qez/image/upload/v1784184944/pixel-office-hr-card-skin_jt9wa6.webp",
      advisor:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784184979/pixel-office-advisor-card-skin_sxd2qm.webp",
      ceo: "https://res.cloudinary.com/pumy6qez/image/upload/v1784184984/pixel-office-ceo-card-skin_iafiji.webp",
    },
    slotFrames: {
      intern:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784184947/pixel-office-intern-card-frame_coircs.webp",
      cleaner:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784184942/pixel-office-cleaner-card-frame_pcsqbg.webp",
      manager:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784184948/pixel-office-manager-card-frame_t9qssm.webp",
      senior:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784184975/pixel-office-senior-card-frame_sqnxkg.webp",
      pm: "https://res.cloudinary.com/pumy6qez/image/upload/v1784184973/pixel-office-pm-card-frame_sxgidl.webp",
      hr: "https://res.cloudinary.com/pumy6qez/image/upload/v1784184943/pixel-office-hr-card-frame_vjjphj.webp",
      advisor:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784184977/pixel-office-advisor-card-frame_mgqccs.webp",
      ceo: "https://res.cloudinary.com/pumy6qez/image/upload/v1784184983/pixel-office-ceo-card-frame_mcr7pa.webp",
    },
  }),
  windows98: createTheme({
    key: "windows98",
    aliases: ["windows 98", "win98", "retro office", "windows 98 style"],
    logoUrl:
      "https://res.cloudinary.com/pumy6qez/image/upload/v1784280652/windows98-logo_vqk7kn.webp",
    slotImages: {
      intern:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784280651/windows98-intern-card-skin_m3yqvv.webp",
      cleaner:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784280650/windows98-cleaner-card-skin_nm8a2x.webp",
      manager:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784280651/windows98-manager-card-skin_uounb6.webp",
      senior:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784280652/windows98-senior-card-skin_dlqnng.webp",
      pm: "https://res.cloudinary.com/pumy6qez/image/upload/v1784280652/windows98-pm-card-skin_obtd3l.webp",
      hr: "https://res.cloudinary.com/pumy6qez/image/upload/v1784280651/windows98-hr-card-skin_zbgiw0.webp",
      advisor:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784280650/windows98-advisor-card-skin_zlmoue.webp",
      ceo: "https://res.cloudinary.com/pumy6qez/image/upload/v1784280651/windows98-ceo-card-skin_ysgxhw.webp",
    },
    slotFrames: {
      intern:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784280651/windows98-intern-card-frame_jarvbj.webp",
      cleaner:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784280651/windows98-cleaner-card-frame_qs3qh4.webp",
      manager:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784280651/windows98-manager-card-frame_tfav4f.webp",
      senior:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784280652/windows98-senior-card-frame_ct4pzo.webp",
      pm: "https://res.cloudinary.com/pumy6qez/image/upload/v1784280651/windows98-pm-card-frame_hmklqj.webp",
      hr: "https://res.cloudinary.com/pumy6qez/image/upload/v1784280650/windows98-hr-card-frame_jcqi3i.webp",
      advisor:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784280650/windows98-advisor-card-frame_sdssbc.webp",
      ceo: "https://res.cloudinary.com/pumy6qez/image/upload/v1784280650/windows98-ceo-card-frame_jyjd5z.webp",
    },
  }),
  tarot: createTheme({
    key: "tarot",
    aliases: ["tarot", "塔羅牌風格", "塔羅牌"],
    logoUrl:
      "https://res.cloudinary.com/pumy6qez/image/upload/v1784526032/tarot-logo_ak0d9h.webp",
    slotImages: {
      intern:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784519782/card-bg-intern_hypihm.webp",
      cleaner:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784519781/card-bg-cleaner_vgx7ny.webp",
      manager:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784519782/card-bg-manager_atavfx.webp",
      senior:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784519785/card-bg-senior_c30b07.webp",
      pm: "https://res.cloudinary.com/pumy6qez/image/upload/v1784519782/card-bg-pm_sn89qt.webp",
      hr: "https://res.cloudinary.com/pumy6qez/image/upload/v1784519781/card-bg-hr_bmgetc.webp",
      advisor:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784519781/card-bg-advisor_lv9hg4.webp",
      ceo: "https://res.cloudinary.com/pumy6qez/image/upload/v1784519781/card-bg-ceo_tazytm.webp",
    },
    slotFrames: {
      intern:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784519789/card-frame-intern_f65un0.webp",
      cleaner:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784519787/card-frame-cleaner_xdo53r.webp",
      manager:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784519790/card-frame-manager_g3tn5r.webp",
      senior:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784519792/card-frame-senior_i77pph.webp",
      pm: "https://res.cloudinary.com/pumy6qez/image/upload/v1784519792/card-frame-pm_vquajq.webp",
      hr: "https://res.cloudinary.com/pumy6qez/image/upload/v1784519788/card-frame-hr_dguvjr.webp",
      advisor:
        "https://res.cloudinary.com/pumy6qez/image/upload/v1784519786/card-frame-advisor_ioylpq.webp",
      ceo: "https://res.cloudinary.com/pumy6qez/image/upload/v1784519786/card-frame-ceo_owxrqb.webp",
    },
  }),
};

function normalizeThemeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
}

function resolveCardSkinThemeKey(source) {
  const candidates = [
    source?.themeKey,
    source?.key,
    source?.name,
    source?.description,
    source?.previewImage,
    source?.imageUrl,
    source?.image_url,
    source,
  ].map((value) => normalizeThemeKey(value));

  for (const [themeKey, theme] of Object.entries(CARD_SKIN_THEMES)) {
    const matchers = theme.aliases.map((value) => normalizeThemeKey(value));
    if (candidates.some((candidate) => matchers.some((matcher) => candidate.includes(matcher)))) {
      return themeKey;
    }
  }

  return "";
}

function getCardSkinTheme(themeSource) {
  return CARD_SKIN_THEMES[resolveCardSkinThemeKey(themeSource)] ?? null;
}

function getCardSkinThemeLogo(themeSource) {
  const sourceLogoUrl = resolveImageAssetUrl(
    themeSource?.imageUrl || themeSource?.image_url || themeSource?.previewImage,
  );

  return sourceLogoUrl || getCardSkinTheme(themeSource)?.logoUrl || "";
}

function getCardSkinThemeSlotImage(themeSource, slotKey) {
  return getCardSkinTheme(themeSource)?.slotImages?.[slotKey] || "";
}

function getCardSkinThemeSlotFrame(themeSource, slotKey) {
  return getCardSkinTheme(themeSource)?.slotFrames?.[slotKey] || "";
}

function getCardSkinThemeSlotAsset(themeSource, slotKey) {
  return {
    backgroundUrl: getCardSkinThemeSlotImage(themeSource, slotKey),
    frameUrl: getCardSkinThemeSlotFrame(themeSource, slotKey),
  };
}

function getCardSkinThemeSlotImages(themeSource) {
  return getCardSkinTheme(themeSource)?.slotImages || {};
}

function getCardSkinThemeSlotFrames(themeSource) {
  return getCardSkinTheme(themeSource)?.slotFrames || {};
}

export {
  CARD_SKIN_THEMES,
  getCardSkinTheme,
  getCardSkinThemeLogo,
  getCardSkinThemeSlotAsset,
  getCardSkinThemeSlotFrame,
  getCardSkinThemeSlotFrames,
  getCardSkinThemeSlotImage,
  getCardSkinThemeSlotImages,
  resolveCardSkinThemeKey,
};
