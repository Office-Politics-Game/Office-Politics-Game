import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const expectedUrls = [
  "https://res.cloudinary.com/pumy6qez/image/upload/v1784519782/card-bg-intern_hypihm.webp",
  "https://res.cloudinary.com/pumy6qez/image/upload/v1784519789/card-frame-intern_f65un0.webp",
  "https://res.cloudinary.com/pumy6qez/image/upload/v1784519781/card-bg-cleaner_vgx7ny.webp",
  "https://res.cloudinary.com/pumy6qez/image/upload/v1784519787/card-frame-cleaner_xdo53r.webp",
  "https://res.cloudinary.com/pumy6qez/image/upload/v1784519782/card-bg-manager_atavfx.webp",
  "https://res.cloudinary.com/pumy6qez/image/upload/v1784519790/card-frame-manager_g3tn5r.webp",
  "https://res.cloudinary.com/pumy6qez/image/upload/v1784519785/card-bg-senior_c30b07.webp",
  "https://res.cloudinary.com/pumy6qez/image/upload/v1784519792/card-frame-senior_i77pph.webp",
  "https://res.cloudinary.com/pumy6qez/image/upload/v1784519782/card-bg-pm_sn89qt.webp",
  "https://res.cloudinary.com/pumy6qez/image/upload/v1784519792/card-frame-pm_vquajq.webp",
  "https://res.cloudinary.com/pumy6qez/image/upload/v1784519781/card-bg-hr_bmgetc.webp",
  "https://res.cloudinary.com/pumy6qez/image/upload/v1784519788/card-frame-hr_dguvjr.webp",
  "https://res.cloudinary.com/pumy6qez/image/upload/v1784519781/card-bg-advisor_lv9hg4.webp",
  "https://res.cloudinary.com/pumy6qez/image/upload/v1784519786/card-frame-advisor_ioylpq.webp",
  "https://res.cloudinary.com/pumy6qez/image/upload/v1784519781/card-bg-ceo_tazytm.webp",
  "https://res.cloudinary.com/pumy6qez/image/upload/v1784519786/card-frame-ceo_owxrqb.webp",
];

test("tarot pool uses separate Cloudinary card assets", async () => {
  const sources = await Promise.all(
    [
      "server/src/db/seedCards.js",
      "server/src/db/gachaSetup.sql",
      "server/src/db/schema.sql",
    ].map(readSource),
  );

  sources.forEach((source) => {
    expectedUrls.forEach((url) => assert.match(source, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))));
    assert.match(source, /card_101/);
    assert.match(source, /tarot_cards/);
  });
});
