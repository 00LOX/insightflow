alter table public.topics drop constraint topics_end_hour_check;
alter table public.topics add constraint topics_end_hour_check check(end_hour between 0 and 24);
alter table public.topics alter column end_hour set default 24;
-- Preserve the original all-day default; explicit time windows end at the stated hour.
update public.topics set end_hour=24 where start_hour=0 and end_hour=23;
