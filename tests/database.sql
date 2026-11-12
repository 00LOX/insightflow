\set ON_ERROR_STOP on
begin;
create function pg_temp.assert_true(condition boolean,label text) returns void language plpgsql as $$ begin if condition is distinct from true then raise exception 'FAIL: %',label;end if;raise notice 'PASS: %',label;end $$;
select pg_temp.assert_true(not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity),'所有公开业务表启用RLS');
insert into public.ideas(user_id,title,notes) values(:'account_a','SQL事务测试','测试结束回滚') returning id as fixture_idea \gset
insert into public.ai_operations(user_id,idempotency_key,kind,resource_id,model) values(:'account_a',gen_random_uuid(),'idea',:'fixture_idea','SQL_TEST_FIXTURE') returning id as fixture_op \gset
insert into public.ai_analyses(user_id,operation_id,kind,resource_id,result) values(:'account_a',:'fixture_op','idea',:'fixture_idea','{"summary":"测试夹具，非真实AI结果"}');
insert into public.usage_records(user_id,operation_id,kind) values(:'account_a',:'fixture_op','idea');
insert into public.saved_articles(user_id,article_id) select :'account_a',id from public.articles limit 1 on conflict do nothing;
insert into public.product_events(user_id,event) values(:'account_a','feature_error');
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',:'account_b','role','authenticated')::text,true);
select pg_temp.assert_true((select count(*)=0 from public.profiles where id=:'account_a'),'profiles跨账户隔离');
select pg_temp.assert_true((select count(*)=0 from public.subscriptions where user_id=:'account_a'),'subscriptions跨账户隔离');
select pg_temp.assert_true((select count(*)=0 from public.topics where user_id=:'account_a'),'topics跨账户隔离');
select pg_temp.assert_true((select count(*)=0 from public.ideas where id=:'fixture_idea'),'ideas跨账户隔离');
select pg_temp.assert_true((select count(*)=0 from public.saved_articles where user_id=:'account_a'),'saved_articles跨账户隔离');
select pg_temp.assert_true((select count(*)=0 from public.ai_analyses where user_id=:'account_a'),'ai_analyses跨账户隔离');
select pg_temp.assert_true((select count(*)=0 from public.usage_records where user_id=:'account_a'),'usage_records跨账户隔离');
select pg_temp.assert_true((select count(*)=0 from public.ai_operations where user_id=:'account_a'),'ai_operations跨账户隔离');
select pg_temp.assert_true((select count(*)=0 from public.monitoring_runs where user_id=:'account_a'),'monitoring_runs跨账户隔离');
select pg_temp.assert_true((select count(*)=0 from public.product_events where user_id=:'account_a'),'product_events跨账户隔离');
select pg_temp.assert_true((select count(*)=0 from public.topic_articles),'topic_articles随主题所有权隔离');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.subscriptions','UPDATE'),'不能直接更改套餐');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.usage_records','INSERT'),'不能伪造用量');
select pg_temp.assert_true(not has_function_privilege('authenticated','public.reserve_ai(uuid,uuid,text,uuid,text)','EXECUTE'),'预留RPC不向客户端开放');
select pg_temp.assert_true(not has_function_privilege('anon','public.start_monitoring(uuid,uuid)','EXECUTE'),'匿名不能触发服务端采集RPC');
rollback;
