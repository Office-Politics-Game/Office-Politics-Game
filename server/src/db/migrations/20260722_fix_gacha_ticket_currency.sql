UPDATE shop_items
SET currency = 'diamond',
    updated_at = CURRENT_TIMESTAMP
WHERE type = 'gacha_ticket'
  AND currency <> 'diamond';
