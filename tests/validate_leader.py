"""Valida painel do líder com HTTP simulado (não usa pessoas nem contas reais)."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE='https://shema.test/'
uid='00000000-0000-0000-0000-000000000001'
group={'id':'00000000-0000-0000-0000-000000000050','title':'Jovens de teste','code':'AABBCCDDEEFF00112233'}
calls=[]
member_added=False

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
    ctx=browser.new_context(service_workers='block')
    ctx.add_init_script("""sessionStorage.setItem('shema-v9-laboratorio::sessao',
      JSON.stringify({user:{id:'00000000-0000-0000-0000-000000000001',email:'teste@example.invalid'},
      access_token:'fake-token',refresh_token:'fake-refresh',expires_at:Date.now()+3600000}));""")
    def respond(route):
        global member_added
        req=route.request
        url=req.url
        if url.startswith(BASE):
            rel=url[len(BASE):].split('?')[0]
            f=ROOT/rel
            if f.is_file():
                ct={'html':'text/html','js':'text/javascript','png':'image/png','webmanifest':'application/manifest+json'}
                route.fulfill(path=str(f),content_type=ct.get(f.suffix.lstrip('.'),'text/plain'))
            else:
                route.abort()
            return
        if '.supabase.co/' in url:
            assert 'ftcxatrfnuhlofpqfvtx' in url
            assert req.headers.get('authorization')=='Bearer fake-token'
            if '/rpc/' in url:
                method=url.rsplit('/',1)[-1]
                calls.append(method)
                if method=='shema_group_state':
                    out={'isLeader':True,'leading':[group],
                         'joined': ([{'id':group['id'],'title':group['title'],'name':'Teste'}] if member_added else [])}
                elif method=='shema_group_overview':
                    out={'id':group['id'],'title':group['title'],'memberCount':1,
                         'synced7':1,'synced30':1,'averageHouses':4,
                         'members':[{'name':'Participante de teste','houses':4,'xp':230,'syncedAt':'2026-10-26T10:00:00Z'}]}
                elif method=='shema_group_join':
                    member_added=True
                    out={'id':group['id'],'title':group['title']}
                elif method=='shema_group_leave':
                    member_added=False
                    out=True
                else: out={}
            elif '/auth/v1/user' in url:
                out={'id':uid,'email':'teste@example.invalid'}
            elif '/rest/v1/user_progress' in url:out=[]
            else:out={}
            route.fulfill(json=out)
            return
        route.abort()
    ctx.route('**/*',respond)
    page=ctx.new_page()
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE+'v9/index.html')
    page.wait_for_function("document.querySelector('#slArea') && !document.querySelector('#slArea').hidden",timeout=15000)
    page.wait_for_function("document.querySelector('#slLeading')?.textContent.includes('Jovens de teste')")
    page.evaluate("go('profile')")
    assert page.locator('#shemaLeaderPanel').is_visible()
    page.fill('#slCode',group['code'])
    page.fill('#slName','Teste')
    page.click('#slJoin')
    assert 'shema_group_join' not in calls, 'Não pode aderir sem consentimento'
    page.check('#slConsent')
    page.click('#slJoin')
    page.wait_for_function("document.querySelector('#slJoined')?.textContent.includes('Jovens de teste')")
    assert 'shema_group_join' in calls
    page.click('#slLeading button')
    page.wait_for_function("document.querySelector('#slParticipants')?.textContent.includes('Participante de teste')")
    text=page.locator('#slParticipants').inner_text()
    assert '4 de 365 casas' in text and '230 XP' in text
    assert 'reflexão secreta' not in text and 'anotação privada' not in text
    assert not errors,errors
    browser.close()
print('PASS: painel, convite com consentimento, métricas mínimas e JS sem erros')
