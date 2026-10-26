"""Configuration guardrails; production artifact never sends remote requests."""
import importlib.util
import json
import os
import subprocess
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('prepare',ROOT/'scripts/prepare_production.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
with tempfile.TemporaryDirectory() as tmp:
    output=module.prepare(ROOT/'config/production.example.json',Path(tmp)/'production')
    assert (output/'index.html').read_bytes()==(ROOT/'v9/index.html').read_bytes()
    assert 'ftcxatrfnuhlofpqfvtx' not in (output/'config.js').read_text()
    try:module.prepare(ROOT/'config/production.example.json',output);raise AssertionError('overwrite')
    except ValueError:pass
    runtime=(ROOT/'v9/config-runtime.js').read_text()
    for config in [None,{}, {'environment':'production','cloudEnabled':True,'supabaseUrl':'https://ftcxatrfnuhlofpqfvtx.supabase.co','publishableKey':'sb_publishable_test'}, {'environment':'production','cloudEnabled':True,'supabaseUrl':'https://ghzvomquldrqpsosvbig.supabase.co','publishableKey':'sb_secret_test'}]:
        js='global.window={SHEMA_CONFIG:'+json.dumps(config)+'};'+runtime+';if(window.ShemaEnvironment.cloudEnabled)process.exit(1);'
        subprocess.run(['node','-e',js],check=True)
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'),args=['--no-sandbox'])
        ctx=browser.new_context(service_workers='block');external=[]
        def route(r):
            if r.request.url.startswith('https://shema.test/production/'):
                path=output/r.request.url.split('/production/')[1]
                r.fulfill(path=str(path));return
            external.append(r.request.url);r.abort()
        ctx.route('**/*',route)
        page=ctx.new_page()
        page.add_init_script("localStorage.setItem('shema-v9-atlas-preview::shemaXP','777');localStorage.setItem('shema-v9-production::shemaXP','12')")
        page.goto('https://shema.test/production/index.html')
        assert page.evaluate('xp')==12
        assert page.evaluate("localStorage.getItem('shema-v9-atlas-preview::shemaXP')")=='777'
        assert page.evaluate('ShemaEnvironment.environment')=='production'
        assert page.evaluate('ShemaEnvironment.cloudEnabled') is False
        assert page.evaluate('ShemaEnvironment.storagePrefix')=='shema-v9-production::'
        page.evaluate("go('profile')")
        assert page.locator('#shemaCloudSignup').is_disabled()
        assert page.locator('#shemaCloudLogin').is_disabled()
        assert not any('supabase.co' in url for url in external)
        browser.close()
print('PASS: config ausente/inválida/privilegiada bloqueada; produção isolada e desativada; sem overwrite')
