UPDATE shop_items
SET price = 100,
    currency = 'diamond',
    updated_at = CURRENT_TIMESTAMP
WHERE type = 'gacha_ticket'
  AND (price <> 100 OR currency <> 'diamond');
