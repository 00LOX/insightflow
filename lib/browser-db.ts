import {createBrowserClient} from '@supabase/ssr';
export function browserDb(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;if(!url||!key)throw new Error('Supabase 尚未配置，请参阅 README');return createBrowserClient(url,key);}
