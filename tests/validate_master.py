"""Validação de interface Master com HTTP simulado. Não substitui os testes RLS reais."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
uid='00000000-0000-0000-0000-000000000001'
state={'master':False,'approved':False,'calls':[]}
with sync_playwright() as p:
    browser=p.chromium.launch(args=['--no-sandbox'])
    ctx=browser.new_context(service_workers='block')
    ctx.add_init_script("""sessionStorage.setItem('shema-v9-laboratorio::sessao',
      JSON.stringify({user:{id:'00000000-0000-0000-0000-000000000001',email:'conta@teste.invalid'},
      access_token:'fake-token',refresh_token:'fake-refresh',expires_at:Date.now()+3600000}));""")
    def route(rt):
        req=rt.request;url=req.url
        if url.startswith('https://shema.test/'):
            path=ROOT/url[len('https://shema.test/'):].split('?')[0]
            if path.is_file():rt.fulfill(path=str(path),content_type='text/html' if path.suffix=='.html' else 'text/javascript' if path.suffix=='.js' else 'application/octet-stream')
            else:rt.abort()
            return
        if '.supabase.co/' not in url:rt.abort();return
        assert 'ftcxatrfnuhlofpqfvtx.supabase.co' in url
        assert req.headers.get('authorization')=='Bearer fake-token'
        if '/rest/v1/rpc/' in url:
            method=url.split('/rest/v1/rpc/')[1]
            state['calls'].append(method)
            if method=='shema_admin_me':data={'isMaster':state['master'],'canClaim':not state['master']}
            elif method=='shema_master_claim':state['master']=True;data={'isMaster':True}
            elif method=='shema_master_overview':
                assert state['master']
                data={'total':3,'withProgress':2,'synced7':1,'synced30':2,'averageHouses':55.5,
                      'distribution':[1,1,0,1,0,0],
                      'users':[{'id':uid,'name':'Participante de teste','email':'teste@example.invalid',
                                'houses':4,'xp':230,'syncedAt':'2026-10-26T10:00:00Z'}],
                      'listLimit':200}
            elif method=='shema_master_leaders':
                assert state['master']
                data={'leaders':([{'id':'00000000-0000-0000-0000-000000000002','email':'lider@teste.invalid',
                                   'enabled':True,'isMaster':False}] if state['approved'] else []),
                      'requests':([] if state['approved'] else
                        [{'id':'00000000-0000-0000-0000-000000000002',
                          'email':'lider@teste.invalid','verified':True}])}
            elif method=='shema_master_set_leader':
                assert state['master'] and req.post_data_json['p_enabled'] is True
                state['approved']=True
                data={'enabled':True}
            elif method=='shema_group_state':data={'isLeader':True,'leading':[],'joined':[]}
            else:data={}
            rt.fulfill(json=data);return
        if '/auth/v1/user' in url:
            rt.fulfill(json={'id':uid,'email':'conta@teste.invalid'});return
        if '/rest/v1/user_progress' in url:
            rt.fulfill(json=[]);return
        rt.fulfill(json={})
    ctx.route('**/*',route)
    page=ctx.new_page();page.on('dialog',lambda d:d.accept())
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('https://shema.test/v9/index.html')
    page.wait_for_function("document.querySelector('#smClaim') && !document.querySelector('#smClaim').hidden")
    page.evaluate("go('profile')")
    assert page.locator('#smClaimButton').is_visible()
    assert page.locator('#smDashboard').is_hidden()
    page.click('#smClaimButton')
    page.wait_for_function("document.querySelector('#smDashboard') && !document.querySelector('#smDashboard').hidden")
    page.wait_for_function("document.querySelector('#smPeople').textContent.includes('Participante de teste')")
    assert '3' in page.locator('#smKpis').inner_text()
    assert '4 / 365' in page.locator('#smPeople').inner_text()
    assert '230 XP' in page.locator('#smPeople').inner_text()
    assert page.locator('#smChart .sm-bar').count()==6
    page.locator('#smRequests button').click()
    page.wait_for_function("document.querySelector('#smLeaders').textContent.includes('lider@teste.invalid')")
    assert 'shema_master_set_leader' in state['calls']
    assert not errors,errors
    browser.close()
print('PASS: ativação master, gráficos, busca, aprovação de líder, sem erros JavaScript (HTTP simulado)')
