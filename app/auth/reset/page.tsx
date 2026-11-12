'use client';
import {useState} from 'react';
import {browserDb} from '@/lib/browser-db';
export default function Reset(){const [message,setMessage]=useState('');return <main className="auth-card"><h1>设置新密码</h1><form onSubmit={async e=>{e.preventDefault();const form=new FormData(e.currentTarget);const {error}=await browserDb().auth.updateUser({password:String(form.get('password'))});setMessage(error?error.message:'密码已更新，请返回工作台。')}}><label>新密码<input name="password" type="password" minLength={8} required/></label><button className="button">保存密码</button></form><p role="status">{message}</p><a href="/dashboard">返回工作台</a></main>}
