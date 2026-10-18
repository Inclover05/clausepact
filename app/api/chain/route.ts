import { NextRequest, NextResponse } from 'next/server';
import { agreement, ruling, read, quote, track, configured } from '@/lib/chain';
import { ADDRESS, ID, POLICY } from '@/lib/core.mjs';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest){
 try{
  const params=request.nextUrl.searchParams;const kind=params.get('kind');const id=params.get('id')||'';
  if(kind==='config')return NextResponse.json({contract:configured(),policy:POLICY,chainId:4221});
  if(kind==='agreement')return NextResponse.json({record:await agreement(id),requestIds:JSON.parse(await read('get_requests',[id]))});
  if(kind==='ruling')return NextResponse.json({record:await ruling(id)});
  if(kind==='inbox'){
   if(!ADDRESS.test(id))throw Error('Invalid wallet.');
   const ids=JSON.parse(await read('get_inbox',[id.toLowerCase()])) as string[];
   const offset=Math.max(0,Number(params.get('offset'))||0);const selected=ids.slice().reverse().slice(offset,offset+20).filter(x=>ID.test(x));
   const records=await Promise.all(selected.map(x=>agreement(x)));
   return NextResponse.json({records:records.filter(Boolean),total:ids.length,nextOffset:offset+selected.length});
  }
  throw Error('Unknown read operation.');
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Read failed.'},{status:400});}
}
export async function POST(request:NextRequest){
 try{
  if(Number(request.headers.get('content-length'))>30000)throw Error('Request too large.');
  const text=await request.text();if(text.length>30000)throw Error('Request too large.');
  const body=JSON.parse(text);
  if(body.kind==='quote')return NextResponse.json(await quote(body.action));
  if(body.kind==='track')return NextResponse.json(await track(body.action,body.hash));
  throw Error('Unknown operation.');
 }catch(error){
  // Never serialize provider errors: they may embed request bytes or RPC details.
  const message=error instanceof Error?error.message:'Operation failed.';
  return NextResponse.json({error:message.length<240?message:'Network request failed. Keep the saved transaction and refresh tracking.'},{status:400});
 }
}
