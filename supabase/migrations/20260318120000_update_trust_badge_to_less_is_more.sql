/*
  # Update trust badge defaults to "Less is more"

  ## Why
  Existing environments may already have `site_config.trust_badge_*` populated
  with the previous default copy. The marketing hero now uses the new slogan,
  so we update persisted values that still match the old defaults (or are empty).
*/

DO $$
BEGIN
  -- English
  UPDATE site_config
    SET trust_badge_en = 'Less is more: simplicity wins.'
  WHERE
    trust_badge_en IS NULL
    OR btrim(trust_badge_en) = ''
    OR btrim(trust_badge_en) = 'Trusted by 10,000+ businesses';

  -- Turkish
  UPDATE site_config
    SET trust_badge_tr = 'Az, çoktur: sadelik kazanır.'
  WHERE
    trust_badge_tr IS NULL
    OR btrim(trust_badge_tr) = ''
    OR btrim(trust_badge_tr) = '10.000+ işletme tarafından güveniliyor'
    OR btrim(trust_badge_tr) = '10.000+ isletme tarafindan guveniliyor';
END $$;

