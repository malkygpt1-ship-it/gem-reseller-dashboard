alter table public.products
  add column packaged_length_cm numeric(9,2),
  add column packaged_width_cm numeric(9,2),
  add column packaged_depth_cm numeric(9,2),
  add column packaged_weight_kg numeric(9,4);

alter table public.products
  add constraint packaged_length_nonnegative check (packaged_length_cm is null or packaged_length_cm >= 0),
  add constraint packaged_width_nonnegative check (packaged_width_cm is null or packaged_width_cm >= 0),
  add constraint packaged_depth_nonnegative check (packaged_depth_cm is null or packaged_depth_cm >= 0),
  add constraint packaged_weight_nonnegative check (packaged_weight_kg is null or packaged_weight_kg >= 0);
