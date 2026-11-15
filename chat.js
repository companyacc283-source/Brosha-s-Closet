const SB_URL='https://guejjcyzbmagriskgmop.supabase.co',SB_KEY='sb_publishable_5uNlCWo0ZoGVNAyEwZ1jTw_-BDU2gVi';
const hits={},FALLBACK='দুঃখিত, এখন উত্তর দিতে পারছি না। অনুগ্রহ করে WhatsApp-এ কথা বলুন, আমাদের টিম দ্রুত জানাবে।';
module.exports=async(req,res)=>{
 if(req.method!=='POST')return res.status(405).json({});
 const ip=String(req.headers['x-forwarded-for']||'x').split(',')[0],now=Date.now();
 hits[ip]=(hits[ip]||[]).filter(t=>now-t<600000);
 if(hits[ip].length>=20)return res.json({reply:'অনেক প্রশ্ন হয়ে গেছে। একটু পরে আবার চেষ্টা করুন বা WhatsApp-এ কথা বলুন।'});
 hits[ip].push(now);
 const key=process.env.GEMINI_API_KEY;
 if(!key)return res.json({reply:FALLBACK});
 const msgs=((req.body&&req.body.messages)||[]).slice(-8).map(m=>({role:m.role==='user'?'user':'model',parts:[{text:String(m.text||'').slice(0,500)}]}));
 while(msgs.length&&msgs[0].role!=='user')msgs.shift();
 if(!msgs.length)return res.json({reply:'আপনার প্রশ্নটি লিখুন।'});
 const S={};let P=[];
 try{
  const H={apikey:SB_KEY};
  const[a,b]=await Promise.all([
   fetch(SB_URL+'/rest/v1/settings?select=*',{headers:H}).then(r=>r.json()),
   fetch(SB_URL+'/rest/v1/products?select=name,price,old_price,categories(name),product_variants(color,sizes)&is_active=eq.true&limit=60',{headers:H}).then(r=>r.json())]);
  (Array.isArray(a)?a:[]).forEach(r=>S[r.key]=r.value);P=Array.isArray(b)?b:[];
 }catch(e){}
 const pays=['ক্যাশ অন ডেলিভারি',S.bkash&&'bKash '+S.bkash,S.nagad&&'Nagad '+S.nagad,S.rocket&&'Rocket '+S.rocket].filter(Boolean).join(', ');
 const list=P.map(p=>`- ${p.name} | ${(p.categories&&p.categories.name)||''} | ৳${p.price}${p.old_price?` (আগে ৳${p.old_price})`:''} | ${(p.product_variants||[]).map(v=>`${v.color||'-'}: ${Object.entries(v.sizes||{}).map(([s,n])=>s+'('+(n>0?n+' পিস':'স্টক নেই')+')').join(' ')}`).join('; ')}`).join('\n');
 const sys=`তুমি Brosha's Closet (পোশাকের দোকান, দোকান ২৫, পূর্বানী প্লাজা, কোনাপাড়া, ডেমরা, ঢাকা) এর অনলাইন সহকারী। সারা বাংলাদেশে ডেলিভারি হয়।
নিয়ম: কাস্টমার যে ভাষায় লেখে সেই ভাষায় ছোট ও ভদ্র উত্তর দাও। শুধু নিচের তথ্য থেকে উত্তর দাও। যা জানা নেই (যেমন নির্দিষ্ট অর্ডারের অবস্থা, ডেলিভারির সঠিক সময়) তা বানিয়ে বলবে না; বলবে এটা আমাদের টিম নিশ্চিত করবে এবং WhatsApp-এ জানালে দ্রুত উত্তর পাবেন। পাসওয়ার্ড, কার্ড নম্বর বা OTP কখনো চাইবে না। দোকানের বাইরের বিষয়ে উত্তর দেবে না।
ডেলিভারি চার্জ: ঢাকার ভেতরে ${S.d_in||60} টাকা, ঢাকার বাইরে ${S.d_out||120} টাকা।
পেমেন্ট: ${pays}। মোবাইল পেমেন্টে Send Money করে অর্ডারের সময় TrxID দিতে হয়।
${S.info?'দোকানের অতিরিক্ত তথ্য: '+S.info:''}
প্রোডাক্ট তালিকা:
${list||'এখনো কোনো প্রোডাক্ট যোগ হয়নি।'}`;
 try{
  const model=process.env.GEMINI_MODEL||'gemini-flash-lite-latest';
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({system_instruction:{parts:[{text:sys}]},contents:msgs,generationConfig:{maxOutputTokens:500,temperature:0.3}})});
  const d=await r.json();
  const parts=(d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts)||[];
  res.json({reply:parts.map(p=>p.text||'').join('').trim()||FALLBACK});
 }catch(e){res.json({reply:FALLBACK})}
};
