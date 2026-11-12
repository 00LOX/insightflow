import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';

export function isPublicAddress(address:string):boolean{
 const ip=address.toLowerCase().replace(/^\[|\]$/g,'');
 if(isIP(ip)===4){const p=ip.split('.').map(Number);return !(p[0]===0||p[0]===10||p[0]===127||p[0]>=224||p[0]===169&&p[1]===254||p[0]===172&&p[1]>=16&&p[1]<=31||p[0]===192&&(p[1]===168||p[1]===0&&p[2]===0)||p[0]===100&&p[1]>=64&&p[1]<=127||p[0]===198&&(p[1]===18||p[1]===19));}
 if(isIP(ip)===6){if(ip==='::'||ip==='::1'||/^f[cd]/.test(ip)||/^fe[89ab]/.test(ip)||ip.startsWith('ff')||ip.startsWith('::ffff:')||ip.startsWith('2001:db8:'))return false;return /^[23]/.test(ip)}
 return false;
}
type Resolve=(host:string)=>Promise<{address:string}[]>;
export async function assertPublicRemoteUrl(raw:string,resolve:Resolve=host=>lookup(host,{all:true,verbatim:true})){
 const url=new URL(raw);
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.port&&!['80','443'].includes(url.port))throw new Error('不允许的来源地址');
 const host=url.hostname.toLowerCase().replace(/^\[|\]$/g,'');
 if(host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal'))throw new Error('禁止本机或内网来源');
 let timer:ReturnType<typeof setTimeout>|undefined;
 const addresses=isIP(host)?[{address:host}]:await Promise.race([
  resolve(host),
  new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('来源 DNS 查询超时')),2000)}),
 ]).finally(()=>clearTimeout(timer));
 if(!addresses.length||addresses.some(a=>!isPublicAddress(a.address)))throw new Error('禁止本机或内网来源');
 return url;
}
