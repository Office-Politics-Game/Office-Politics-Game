import pool from "./index.js";

const cards = [
  ["CEO", 8, 1, "role", "Boss"],
  ["Advisor", 7, 1, "role", "Force"],
  ["HR", 6, 1, "role", "Swap"],
  ["PM", 5, 2, "role", "Redraw"],
  ["Senior", 4, 2, "role", "Shield"],
  ["Manager", 3, 2, "role", "Duel"],
  ["Cleaner", 2, 2, "role", "Peek"],
  ["Intern", 1, 5, "role", "Guess"],
];

const gachaCards = [
  ["card_001", "樂高實習生", 1, "role", "樂高實習生", "intern", "intern", "https://res.cloudinary.com/pumy6qez/image/upload/v1784016294/lego-intern-card-skin_yeap7f.webp", "https://res.cloudinary.com/pumy6qez/image/upload/v1784016293/lego-intern-card-frame_ejahmh.webp"],
  ["card_002", "樂高打掃阿姨", 2, "role", "樂高打掃阿姨", "cleaner", "cleaner", "https://res.cloudinary.com/pumy6qez/image/upload/v1784016291/lego-cleaner-card-skin_ko1tbt.webp", "https://res.cloudinary.com/pumy6qez/image/upload/v1784016291/lego-cleaner-card-frame_k2l66z.webp"],
  ["card_003", "樂高部門主管", 3, "role", "樂高部門主管", "manager", "manager", "https://res.cloudinary.com/pumy6qez/image/upload/v1784016295/lego-manager-card-skin_wkq4hg.webp", "https://res.cloudinary.com/pumy6qez/image/upload/v1784016294/lego-manager-card-frame_nhuarb.webp"],
  ["card_004", "樂高職場老鳥", 4, "role", "樂高職場老鳥", "senior", "senior", "https://res.cloudinary.com/pumy6qez/image/upload/v1784016298/lego-senior-card-skin_auanea.webp", "https://res.cloudinary.com/pumy6qez/image/upload/v1784016296/lego-senior-card-frame_axweus.webp"],
  ["card_005", "樂高專案經理", 5, "role", "樂高專案經理", "pm", "pm", "https://res.cloudinary.com/pumy6qez/image/upload/v1784016297/lego-pm-card-skin_is3lyw.webp", "https://res.cloudinary.com/pumy6qez/image/upload/v1784016296/lego-pm-card-frame_hlsid9.webp"],
  ["card_006", "樂高人資主管", 6, "role", "樂高人資主管", "hr", "hr", "https://res.cloudinary.com/pumy6qez/image/upload/v1784016293/lego-hr-card-skin_wir4jw.webp", "https://res.cloudinary.com/pumy6qez/image/upload/v1784016292/lego-hr-card-frame_qofkeq.webp"],
  ["card_007", "樂高資深顧問", 7, "role", "樂高資深顧問", "advisor", "advisor", "https://res.cloudinary.com/pumy6qez/image/upload/v1784016288/lego-advisor-card-skin_r7dqww.webp", "https://res.cloudinary.com/pumy6qez/image/upload/v1784016288/lego-advisor-card-frame_y52pim.webp"],
  ["card_008", "樂高執行長", 8, "role", "樂高執行長", "ceo", "ceo", "https://res.cloudinary.com/pumy6qez/image/upload/v1784016290/lego-ceo-card-skin_msw96k.webp", "https://res.cloudinary.com/pumy6qez/image/upload/v1784016289/lego-ceo-card-frame_nmieox.webp"],
  ["card_101", "實習生", 1, "role", "實習生", "intern", "intern", "https://res.cloudinary.com/pumy6qez/image/upload/v1784519782/card-bg-intern_hypihm.webp", "https://res.cloudinary.com/pumy6qez/image/upload/v1784519789/card-frame-intern_f65un0.webp"],
  ["card_102", "打掃阿姨", 2, "role", "打掃阿姨", "cleaner", "cleaner", "https://res.cloudinary.com/pumy6qez/image/upload/v1784519781/card-bg-cleaner_vgx7ny.webp", "https://res.cloudinary.com/pumy6qez/image/upload/v1784519787/card-frame-cleaner_xdo53r.webp"],
  ["card_103", "部門主管", 3, "role", "部門主管", "manager", "manager", "https://res.cloudinary.com/pumy6qez/image/upload/v1784519782/card-bg-manager_atavfx.webp", "https://res.cloudinary.com/pumy6qez/image/upload/v1784519790/card-frame-manager_g3tn5r.webp"],
  ["card_104", "職場老鳥", 4, "role", "職場老鳥", "senior", "senior", "https://res.cloudinary.com/pumy6qez/image/upload/v1784519785/card-bg-senior_c30b07.webp", "https://res.cloudinary.com/pumy6qez/image/upload/v1784519792/card-frame-senior_i77pph.webp"],
  ["card_105", "專案經理", 5, "role", "專案經理", "pm", "pm", "https://res.cloudinary.com/pumy6qez/image/upload/v1784519782/card-bg-pm_sn89qt.webp", "https://res.cloudinary.com/pumy6qez/image/upload/v1784519792/card-frame-pm_vquajq.webp"],
  ["card_106", "人資主管", 6, "role", "人資主管", "hr", "hr", "https://res.cloudinary.com/pumy6qez/image/upload/v1784519781/card-bg-hr_bmgetc.webp", "https://res.cloudinary.com/pumy6qez/image/upload/v1784519788/card-frame-hr_dguvjr.webp"],
  ["card_107", "資深顧問", 7, "role", "資深顧問", "advisor", "advisor", "https://res.cloudinary.com/pumy6qez/image/upload/v1784519781/card-bg-advisor_lv9hg4.webp", "https://res.cloudinary.com/pumy6qez/image/upload/v1784519786/card-frame-advisor_ioylpq.webp"],
  ["card_108", "執行長", 8, "role", "執行長", "ceo", "ceo", "https://res.cloudinary.com/pumy6qez/image/upload/v1784519781/card-bg-ceo_tazytm.webp", "https://res.cloudinary.com/pumy6qez/image/upload/v1784519786/card-frame-ceo_owxrqb.webp"],
];

async function seedCards() {
  try {
    await pool.query("DELETE FROM cards");

    for (const card of cards) {
      await pool.query(
        `INSERT INTO cards (name, rank, quantity, type, description)
         VALUES ($1, $2, $3, $4, $5)`,
        card,
      );
    }

    await pool.query(
      `INSERT INTO gacha_pools (code, name)
       VALUES
         ('role_cards', '角色卡池'),
         ('tarot_cards', '塔羅牌占星卡池')
       ON CONFLICT (code) DO UPDATE
       SET name = EXCLUDED.name,
           is_active = true,
           updated_at = CURRENT_TIMESTAMP`,
    );

    for (const gachaCard of gachaCards) {
      await pool.query(
        `INSERT INTO gacha_cards (code, name, rank, type, description, image_key, frame_key, image_url, frame_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (code) DO UPDATE
         SET name = EXCLUDED.name,
             rank = EXCLUDED.rank,
             type = EXCLUDED.type,
             description = EXCLUDED.description,
             image_key = EXCLUDED.image_key,
             frame_key = EXCLUDED.frame_key,
             image_url = EXCLUDED.image_url,
             frame_url = EXCLUDED.frame_url,
             is_active = true,
             updated_at = CURRENT_TIMESTAMP`,
        gachaCard,
      );
    }

    await pool.query(
      `UPDATE gacha_pool_cards gpc
       SET is_active = false
       FROM gacha_pools gp
       WHERE gpc.pool_id = gp.id
         AND gp.code IN ('role_cards', 'tarot_cards')`,
    );

    await pool.query(
      `INSERT INTO gacha_pool_cards (pool_id, gacha_card_id, weight)
       SELECT gp.id, gc.id, weights.weight
       FROM gacha_pools gp
       JOIN (
         VALUES
           ('role_cards', 'card_001', 400),
           ('role_cards', 'card_002', 250),
           ('role_cards', 'card_003', 150),
           ('role_cards', 'card_004', 100),
           ('role_cards', 'card_005', 50),
           ('role_cards', 'card_006', 30),
           ('role_cards', 'card_007', 15),
           ('role_cards', 'card_008', 5),
           ('tarot_cards', 'card_101', 400),
           ('tarot_cards', 'card_102', 250),
           ('tarot_cards', 'card_103', 150),
           ('tarot_cards', 'card_104', 100),
           ('tarot_cards', 'card_105', 50),
           ('tarot_cards', 'card_106', 30),
           ('tarot_cards', 'card_107', 15),
           ('tarot_cards', 'card_108', 5)
       ) AS weights(pool_code, card_code, weight) ON weights.pool_code = gp.code
       JOIN gacha_cards gc ON gc.code = weights.card_code
       ON CONFLICT (pool_id, gacha_card_id) DO UPDATE
       SET weight = EXCLUDED.weight,
           is_active = true`,
    );

    console.log("card seed complete");
  } catch (error) {
    console.error("card seed failed", error);
  } finally {
    await pool.end();
  }
}

seedCards();
