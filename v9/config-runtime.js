// Não aceitar ambiente/endpoint arbitrário nem chaves privilegiadas no cliente.
(()=>{'use strict';
 const raw=window.SHEMA_CONFIG;
 const production=raw?.environment==='production';
 const environment=production?'production':'laboratory';
 const expected=production?'https://ghzvomquldrqpsosvbig.supabase.co':'https://ftcxatrfnuhlofpqfvtx.supabase.co';
 const valid=!!raw && ['laboratory','production'].includes(raw.environment) &&
   typeof raw.cloudEnabled==='boolean' && raw.supabaseUrl===expected &&
   (!raw.cloudEnabled || /^sb_publishable_[A-Za-z0-9_-]+$/.test(raw.publishableKey||''));
 const enabled=valid && raw.cloudEnabled;
 window.ShemaEnvironment=Object.freeze({
   environment, cloudEnabled:enabled, valid,
   url:enabled?expected:'', publicKey:enabled?raw.publishableKey:'',
   storagePrefix:production?'shema-v9-production::':'shema-v9-atlas-preview::',
   accountPrefix:production?'shema-v9-production-account::':'shema-v9-laboratorio::'
 });
})();
