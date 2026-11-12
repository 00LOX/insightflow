create function public.cleanup_idea_analysis() returns trigger language plpgsql security definer set search_path='' as $$ begin delete from public.ai_analyses where user_id=old.user_id and resource_id=old.id and kind='idea';return old;end $$;
create trigger cleanup_idea_analysis after delete on public.ideas for each row execute function public.cleanup_idea_analysis();
revoke execute on function public.cleanup_idea_analysis() from public,anon,authenticated;
