-- Extra sample rows for `recommended_items` (Add Items → Items you might like).
-- Safe to re-apply: skips rows that already match `slug`.
begin;

insert into public.recommended_items (slug, name, category, reference_price, sort_order) values
  ('lucky-me-pancit-canton', 'Lucky Me Pancit Canton (6-pack)', 'Food', 4.99, 5),
  ('skyflakes-crackers', 'SkyFlakes Crackers', 'Food', 3.49, 6),
  ('century-tuna', 'Century Tuna (3-pack)', 'Food', 5.99, 7),
  ('mama-sitas-adobo-mix', 'Mama Sita''s Adobo Marinade Mix', 'Food', 2.29, 8),
  ('ziploc-gallon', 'Ziploc Storage Bags (Gallon)', 'Cleaning & Home Care', 12.99, 10),
  ('dawn-dish-soap', 'Dawn Dish Soap', 'Cleaning & Home Care', 3.79, 11),
  ('lysol-wipes', 'Lysol Disinfecting Wipes', 'Cleaning & Home Care', 6.49, 12),
  ('vaseline-lotion', 'Vaseline Intensive Care Lotion', 'Beauty & Health', 7.25, 20),
  ('cetaphil-cleanser', 'Cetaphil Gentle Cleanser', 'Beauty & Health', 14.00, 21),
  ('colgate-toothpaste', 'Colgate Toothpaste (3-pack)', 'Beauty & Health', 5.50, 22),
  ('phone-charger-usb-c', 'USB-C Charging Cable', 'Personal Items', 9.99, 30),
  ('photo-album-small', 'Small Photo Album', 'Personal Items', 11.99, 31)
on conflict (slug) do nothing;

commit;
