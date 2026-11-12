\getenv local_db_password POSTGRES_PASSWORD
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create role authenticator login password :'local_db_password' noinherit;
grant anon,authenticated,service_role to authenticator;
create role supabase_auth_admin login password :'local_db_password' createrole;
create schema auth authorization supabase_auth_admin;
grant usage on schema public to anon,authenticated,service_role,supabase_auth_admin;
grant usage on schema auth to anon,authenticated,service_role;
alter default privileges for role postgres in schema public grant all on tables to service_role;
alter default privileges for role postgres in schema public grant all on sequences to service_role;
alter default privileges for role postgres in schema public grant all on functions to service_role;
create function auth.uid() returns uuid language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
grant execute on function auth.uid() to anon,authenticated,service_role;

alter function auth.uid() owner to supabase_auth_admin;
