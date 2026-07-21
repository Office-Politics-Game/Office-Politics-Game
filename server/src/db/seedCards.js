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
  [
    "card_001",
    "樂高實習生",
    1,
    "role",
    "樂高實習生",
    "intern",
    "intern",
    "https://res.cloudinary.com/pumy6qez/image/upload/v1784016294/lego-intern-card-skin_yeap7f.webp",
    "https://res.cloudinary.com/pumy6qez/image/upload/v1784016293/lego-intern-card-frame_ejahmh.webp",
  ],
  [
    "card_002",
    "樂高打掃阿姨",
    2,
    "role",
    "樂高打掃阿姨",
    "cleaner",
    "cleaner",
    "https://res.cloudinary.com/pumy6qez/image/upload/v1784016291/lego-cleaner-card-skin_ko1tbt.webp",
    "https://res.cloudinary.com/pumy6qez/image/upload/v1784016291/lego-cleaner-card-frame_k2l66z.webp",
  ],
  [
    "card_003",
    "樂高部門主管",
    3,
    "role",
    "樂高部門主管",
    "manager",
    "manager",
    "https://res.cloudinary.com/pumy6qez/image/upload/v1784016295/lego-manager-card-skin_wkq4hg.webp",
    "https://res.cloudinary.com/pumy6qez/image/upload/v1784016294/lego-manager-card-frame_nhuarb.webp",
  ],
  [
    "card_004",
    "樂高職場老鳥",
    4,
    "role",
    "樂高職場老鳥",
    "senior",
    "senior",
    "https://res.cloudinary.com/pumy6qez/image/upload/v1784016298/lego-senior-card-skin_auanea.webp",
    "https://res.cloudinary.com/pumy6qez/image/upload/v1784016296/lego-senior-card-frame_axweus.webp",
  ],
  [
    "card_005",
    "樂高專案經理",
    5,
    "role",
    "樂高專案經理",
    "pm",
    "pm",
    "https://res.cloudinary.com/pumy6qez/image/upload/v1784016297/lego-pm-card-skin_is3lyw.webp",
    "https://res.cloudinary.com/pumy6qez/image/upload/v1784016296/lego-pm-card-frame_hlsid9.webp",
  ],
  [
    "card_006",
    "樂高人資主管",
    6,
    "role",
    "樂高人資主管",
    "hr",
    "hr",
    "https://res.cloudinary.com/pumy6qez/image/upload/v1784016293/lego-hr-card-skin_wir4jw.webp",
    "https://res.cloudinary.com/pumy6qez/image/upload/v1784016292/lego-hr-card-frame_qofkeq.webp",
  ],
  [
    "card_007",
    "樂高資深顧問",
    7,
    "role",
    "樂高資深顧問",
    "advisor",
    "advisor",
    "https://res.cloudinary.com/pumy6qez/image/upload/v1784016288/lego-advisor-card-skin_r7dqww.webp",
    "https://res.cloudinary.com/pumy6qez/image/upload/v1784016288/lego-advisor-card-frame_y52pim.webp",
  ],
  [
    "card_008",
    "樂高執行長",
    8,
    "role",
    "樂高執行長",
    "ceo",
    "ceo",
    "https://res.cloudinary.com/pumy6qez/image/upload/v1784016290/lego-ceo-card-skin_msw96k.webp",
    "https://res.cloudinary.com/pumy6qez/image/upload/v1784016289/lego-ceo-card-frame_nmieox.webp",
  ],
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
       VALUES ('role_cards', '樂高角色卡池')
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
         AND gp.code = 'role_cards'`,
    );

    await pool.query(
      `INSERT INTO gacha_pool_cards (pool_id, gacha_card_id, weight)
       SELECT gp.id, gc.id, weights.weight
       FROM gacha_pools gp
       JOIN (
         VALUES
           ('card_001', 400),
           ('card_002', 250),
           ('card_003', 150),
           ('card_004', 100),
           ('card_005', 50),
           ('card_006', 30),
           ('card_007', 15),
           ('card_008', 5)
       ) AS weights(code, weight) ON true
       JOIN gacha_cards gc ON gc.code = weights.code
       WHERE gp.code = 'role_cards'
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
