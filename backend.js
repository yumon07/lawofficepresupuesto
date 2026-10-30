/* Capa de datos en Supabase: una sola tabla "docs" (coll, id, data jsonb).
   Imita la interfaz que usa la página: collection().get(), doc().get/set/delete. */
(function(){
  const $=s=>document.querySelector(s);
  let sb=null;
  const noCfg=!window.SUPABASE_URL||/TU-PROYECTO/.test(window.SUPABASE_URL)||!window.SUPABASE_ANON_KEY||/TU_CLAVE/.test(window.SUPABASE_ANON_KEY);
  const wrap=r=>({docs:r.map(x=>({data:()=>x.data}))});
  window.SB_DB={
    collection:c=>({get:async()=>{const {data,error}=await sb.from('docs').select('id,data').eq('coll',c);if(error)throw error;return wrap(data)}}),
    doc:p=>{const [c,id]=p.split('/');return{
      get:async()=>{const {data,error}=await sb.from('docs').select('data').eq('coll',c).eq('id',id).maybeSingle();if(error)throw error;return{exists:!!data,data:()=>data&&data.data}},
      set:async o=>{const {error}=await sb.from('docs').upsert({coll:c,id,data:o,updated_at:new Date().toISOString()});if(error)throw error},
      delete:async()=>{const {error}=await sb.from('docs').delete().eq('coll',c).eq('id',id);if(error)throw error}}}
  };
  window.SB_DL={save:async({filename,data})=>{
    const blob=data instanceof Blob?data:new Blob([data],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}};
  window.SB_BOOT=async function(start){
    const login=$('#login'),app=$('#appwrap'),err=$('#lerr');
    $('#llogo').src=$('#brandlogo')?$('#brandlogo').src:'';
    if(noCfg){login.hidden=false;err.textContent='Falta completar config.js con los datos de Supabase.';$('#lform').querySelector('button').disabled=true;return}
    sb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
    let started=false;
    const enter=async()=>{login.hidden=true;app.hidden=false;if(!started){started=true;await start()}};
    $('#btnOut').addEventListener('click',async()=>{await sb.auth.signOut();location.reload()});
    $('#lform').addEventListener('submit',async e=>{e.preventDefault();err.textContent='';
      const {error}=await sb.auth.signInWithPassword({email:$('#lmail').value.trim(),password:$('#lpass').value});
      if(error){err.textContent='Correo o contraseña incorrectos.';return}
      await enter()});
    const {data}=await sb.auth.getSession();
    if(data.session)await enter();else login.hidden=false;
  };
})();
