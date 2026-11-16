/* Serves /product/<slug> (real page for Google + share previews) and /sitemap.xml */
const SB='https://guejjcyzbmagriskgmop.supabase.co',KEY='sb_publishable_5uNlCWo0ZoGVNAyEwZ1jTw_-BDU2gVi';
const e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const api=q=>fetch(SB+'/rest/v1/'+q,{headers:{apikey:KEY}}).then(r=>r.json());
module.exports=async(req,res)=>{
 const host=req.headers['x-forwarded-host']||req.headers.host,base='https://'+host;
 if(req.query.sitemap){
  let L=[];try{const d=await api('products?select=slug,created_at&is_active=eq.true&order=created_at.desc&limit=1000');if(Array.isArray(d))L=d}catch(x){}
  res.setHeader('Content-Type','application/xml; charset=utf-8');res.setHeader('Cache-Control','public, s-maxage=600');
  return res.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/</loc></url>${L.map(p=>`<url><loc>${base}/product/${encodeURIComponent(p.slug)}</loc><lastmod>${String(p.created_at).slice(0,10)}</lastmod></url>`).join('')}</urlset>`);
 }
 const slug=String(req.query.slug||'').slice(0,120);let p=null,html='';
 try{
  const[d,h]=await Promise.all([api(`products?select=name,description,price,old_price,product_variants(color,images,sizes,sort)&is_active=eq.true&slug=eq.${encodeURIComponent(slug)}&limit=1`),fetch(base+'/index.html').then(r=>r.text())]);
  p=Array.isArray(d)&&d[0];html=h;
 }catch(x){}
 if(!p||!html.includes('</head>')){res.statusCode=302;res.setHeader('Location',p?base+'/#/p/'+encodeURIComponent(slug):base+'/');return res.end()}
 const v=(p.product_variants||[]).sort((a,b)=>a.sort-b.sort),imgs=v.flatMap(x=>(x.images||[]).slice(0,2)).slice(0,6),img=imgs[0]||'';
 const title=`${p.name} - Brosha's Closet`,desc=`৳${p.price}${p.old_price?` (আগে ৳${p.old_price})`:''} | ${(p.description||'').slice(0,150)}`.trim(),url=base+'/product/'+encodeURIComponent(slug);
 const inStock=v.some(x=>Object.values(x.sizes||{}).some(n=>+n>0));
 const ld={'@context':'https://schema.org','@type':'Product',name:p.name,description:(p.description||p.name).slice(0,300),image:imgs,brand:{'@type':'Brand',name:"Brosha's Closet"},offers:{'@type':'Offer',url,priceCurrency:'BDT',price:String(p.price),availability:'https://schema.org/'+(inStock?'InStock':'OutOfStock'),itemCondition:'https://schema.org/NewCondition'}};
 const head=`<title>${e(title)}</title><meta name="description" content="${e(desc)}"><link rel="canonical" href="${e(url)}"><meta property="og:type" content="product"><meta property="og:site_name" content="Brosha's Closet"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(desc)}"><meta property="og:url" content="${e(url)}">${img?`<meta property="og:image" content="${e(img)}"><meta name="twitter:image" content="${e(img)}">`:''}<meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">${JSON.stringify(ld).replace(/</g,'\\u003c')}</script>`;
 const out=html.replace(/<title>[\s\S]*?<\/title>/,'').replace(/<meta name="description"[^>]*>/,'').replace(/<link rel="canonical"[^>]*>/,'').replace(/<meta (?:property|name)="(?:og|twitter):[^>]*>/g,'').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,'').replace('</head>',()=>head+'</head>').replace(/<div id="app">[\s\S]*?<\/div>/,()=>`<div id="app"><h1>${e(p.name)}</h1>${img?`<img src="${e(img)}" alt="${e(p.name)}" width="300">`:''}<p>${e(desc)}</p></div>`);
 res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');
 res.end(out);
};
