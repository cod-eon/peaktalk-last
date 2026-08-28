const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export class ApiError extends Error { constructor(message: string, public status: number, public code?: string) { super(message); this.name="ApiError"; } }
export function parseApiErrorBody(value: unknown, fallback: string) {
  const data = value as { detail?: unknown; message?: unknown; code?: unknown; error?: unknown };
  const detail = data?.detail;
  const candidate = detail && typeof detail === 'object' ? detail : data?.error && typeof data.error === 'object' ? data.error : data;
  const item = candidate as { detail?: unknown; message?: unknown; code?: unknown };
  return {
    message: typeof item.message === 'string' ? item.message : typeof item.detail === 'string' ? item.detail : fallback,
    code: typeof item.code === 'string' ? item.code : undefined,
  };
}
type Options=RequestInit & {skipAuthRecovery?:boolean};
async function request(endpoint:string, options:Options={}) { const {skipAuthRecovery,...init}=options; void skipAuthRecovery; const headers=new Headers(init.headers); if(init.body && !(init.body instanceof FormData)) headers.set("Content-Type","application/json"); const response=await fetch(`${API_URL}${endpoint}`,{...init,headers,credentials:"include"}); if(!response.ok){let parsed={message:response.status===401?"Сессия истекла. Пожалуйста, войдите снова.":"Произошла ошибка",code:undefined as string|undefined}; try{parsed=parseApiErrorBody(await response.json(),parsed.message)}catch{} if(response.status===401 && typeof window!=="undefined") window.location.replace(`/login?return=${encodeURIComponent(window.location.pathname+window.location.search)}`); throw new ApiError(parsed.message,response.status,parsed.code);} if(response.status===204)return null; return response.headers.get("content-type")?.includes("application/json")?response.json():response.text(); }
export const api={get:(e:string,o:Options={})=>request(e,{...o,method:"GET"}),post:(e:string,d?:unknown,o:Options={})=>request(e,{...o,method:"POST",body:d===undefined?undefined:JSON.stringify(d)}),put:(e:string,d?:unknown,o:Options={})=>request(e,{...o,method:"PUT",body:d===undefined?undefined:JSON.stringify(d)}),patch:(e:string,d?:unknown,o:Options={})=>request(e,{...o,method:"PATCH",body:d===undefined?undefined:JSON.stringify(d)}),delete:(e:string,o:Options={})=>request(e,{...o,method:"DELETE"}),request};
