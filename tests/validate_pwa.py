"""Real local HTTP, real service worker and offline reload. No external services."""
import functools
import http.server
import os
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
origin=f'http://127.0.0.1:{server.server_port}'
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'),args=['--no-sandbox'])
        ctx=browser.new_context(service_workers='allow')
        # Browser requests outside localhost are blocked; worker only handles local assets.
        ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin+'/') else r.abort())
        page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(origin+'/v9/index.html')
        page.evaluate('navigator.serviceWorker.ready')
        page.wait_for_function('navigator.serviceWorker.controller!==null')
        assert page.evaluate('navigator.serviceWorker.controller.scriptURL').endswith('/v9/service-worker.js')
        keys=page.evaluate('caches.keys()');assert len(keys)==1
        assert page.evaluate("async()=>{const c=await caches.open((await caches.keys())[0]);return (await c.keys()).length}")==7
        page.evaluate("localStorage.setItem('shemaXP','777');shemaV9Storage.setItem('shemaName','Offline RC');caches.open('v7-preserved')")
        ctx.set_offline(True)
        page.reload(wait_until='domcontentloaded')
        assert page.evaluate("shemaV9Storage.getItem('shemaName')")=='Offline RC'
        assert page.evaluate("localStorage.getItem('shemaXP')")=='777'
        assert page.evaluate('PH.length')==365
        ctx.set_offline(False)
        page.goto(origin+'/index.html')
        assert page.evaluate('navigator.serviceWorker.controller') is None
        assert 'v7-preserved' in page.evaluate('caches.keys()')
        assert not errors,errors
        browser.close()
finally:
    server.shutdown();server.server_close()
print('PASS: service worker real, 7 assets, reload offline, progresso persistente, V7 fora do escopo')
