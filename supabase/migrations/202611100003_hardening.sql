-- Enforce history windows even for direct authenticated database reads.
create function public.history_cutoff() returns timestamptz language sql stable security definer set search_path='' as $$ select now()-make_interval(days=>coalesce((select l.history from public.plan_limits l join public.subscriptions s on s.plan=l.plan where s.user_id=auth.uid()),7)) $$;
revoke execute on function public.history_cutoff() from public,anon;
grant execute on function public.history_cutoff() to authenticated,service_role;
drop policy public_articles on public.articles;
create policy public_articles on public.articles for select to authenticated using(published_at is null or published_at>=public.history_cutoff());
drop policy public_article_sources on public.article_sources;
create policy public_article_sources on public.article_sources for select to authenticated using(exists(select 1 from public.articles a where a.id=article_id));
drop policy own_read on public.ai_analyses;
create policy own_read on public.ai_analyses for select to authenticated using(user_id=(select auth.uid()) and created_at>=public.history_cutoff());
drop policy own_topic_articles on public.topic_articles;
create policy own_topic_articles on public.topic_articles for select to authenticated using(exists(select 1 from public.topics t where t.id=topic_id and t.user_id=(select auth.uid())) and exists(select 1 from public.articles a where a.id=article_id));
alter table public.sources add column last_attempt_at timestamptz;
create function public.claim_source(p_source uuid) returns boolean language plpgsql security definer set search_path='' as $$ declare claimed uuid;begin update public.sources set last_attempt_at=now() where id=p_source and (last_attempt_at is null or last_attempt_at<now()-interval '1 second') returning id into claimed;return claimed is not null;end $$;
revoke execute on function public.claim_source(uuid) from public,anon,authenticated;
grant execute on function public.claim_source(uuid) to service_role;
