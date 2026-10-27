"""Validação da árvore genealógica Shema: conteúdo, navegação, mobile e offline."""
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
origin='http://127.0.0.1:'+str(server.server_port)
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'),args=['--no-sandbox'])
        ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,service_workers='allow',is_mobile=True,has_touch=True)
        ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin+'/') else r.abort())
        page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(origin+'/v9/index.html',wait_until='domcontentloaded')
        page.locator('.navin button[data-s="genealogia"]').wait_for()
        views=page.evaluate('window.ShemaGenealogy.getViews()')
        assert len(views)>=10, views
        assert next(v['nodes'] for v in views if v['id']=='mateus')==41
        assert next(v['nodes'] for v in views if v['id']=='lucas')==78
        assert sum(v['nodes'] for v in views)>=350
        page.locator('.navin button[data-s="genealogia"]').click()
        assert page.locator('#genealogia.active').count()==1
        assert page.locator('#sg-viewport').is_visible()
        page.locator('#sg-view').select_option('lucas')
        assert page.locator('#sg-view-reference').inner_text().startswith('Lucas')
        page.locator('#sg-search').fill('Jesus')
        assert page.locator('#sg-results .sg-item').count()>=1
        page.locator('#sg-results .sg-item').first.click()
        assert page.locator('#sg-drawer').is_visible()
        assert 'conforme se pensava' in page.locator('#sg-detail-note').inner_text().lower() or 'conforme se pensava' in page.locator('#sg-detail-relations').inner_text().lower()
        page.locator('#sg-close').click()
        page.locator('#sg-view').select_option('mateus')
        assert page.evaluate("""() => {let v=ShemaGenealogyData.views.find(x=>x.id==='mateus');let n=v.nodes[v.nodes.length-1];return n.name==='Jesus' && n.mother==='Maria' && n.relation.includes('não biológico')}""")
        assert page.evaluate("""() => {let v=ShemaGenealogyData.views.find(x=>x.id==='lucas');return v.nodes[0].name==='Deus' && v.nodes[1].relation.includes('criação')}""")
        page.locator('#sg-list-button').click()
        assert page.locator('#sg-list .sg-item').count()==41
        page.evaluate('navigator.serviceWorker.ready')
        page.wait_for_function('navigator.serviceWorker.controller!==null',timeout=12000)
        ctx.set_offline(True)
        page.reload(wait_until='domcontentloaded')
        page.locator('.navin button[data-s="genealogia"]').click()
        assert page.locator('#sg-viewport').is_visible()
        assert page.evaluate('ShemaGenealogy.getViews().length')>=10
        assert not errors,errors
        browser.close()
finally:
    server.shutdown();server.server_close()
print('PASS: 10 visões, 350+ registros, referências, navegação, fichas, Android e PWA offline')
