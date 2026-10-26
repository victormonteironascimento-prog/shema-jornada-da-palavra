"""Run: python tests/validate_v9.py (Playwright + Chromium required).
All HTTP is intercepted: no requests reach Supabase or Bible providers.
"""
import json, re, subprocess, os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[1]
assert subprocess.check_output(['git','hash-object',str(ROOT/'index.html')],text=True).strip()=='1fefd7f8277dd3591420eacf3d11476e3ece1a1d'
html = (ROOT/'v9/index.html').read_text()
for i, script in enumerate(re.findall(r'<script\b[^>]*>(.*?)</script>', html, re.S)):
    result = subprocess.run(['node','--check','-'], input=script, text=True, capture_output=True)
    assert result.returncode == 0, (i, result.stderr)
subprocess.run(['node','--check',str(ROOT/'v9/service-worker.js')],check=True)
print('PASS: sintaxe de todos os scripts e service worker')
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'), args=['--no-sandbox'])
    ctx = browser.new_context(service_workers='block')
    state = {'row': None, 'writes': 0, 'refreshes': 0, 'signups': 0, 'fault': None, 'race': False}
    errors = []
    def route(r):
        req=r.request; url=req.url
        if url.startswith('https://shema.test/'):
            path=ROOT/url.removeprefix('https://shema.test/')
            r.fulfill(path=str(path),content_type='text/html' if path.suffix=='.html' else None);return
        if '.supabase.co/' in url:
            assert 'ftcxatrfnuhlofpqfvtx.supabase.co' in url, 'Production request!'
            body={}
            if state['fault'] and '/rest/v1/' in url:
                r.fulfill(status=state['fault'],json={'message':'Falha simulada'});return
            if '/auth/v1/signup' in url:
                state['signups']+=1
                r.fulfill(json={'user':{'id':'test-user'}});return
            if '/auth/v1/token' in url:
                if 'refresh_token' in url: state['refreshes']+=1
                body={'access_token':'fake-token','refresh_token':'fake-refresh','expires_in':3600,'user':{'id':'test-user','email':'test@example.invalid'}}
            elif '/auth/v1/user' in url: body={'id':'test-user','email':'test@example.invalid'}
            elif '/rest/v1/user_progress' in url:
                assert req.headers.get('authorization')=='Bearer fake-token'
                assert req.method=='POST' or 'user_id=eq.test-user' in url
                if req.method in ['POST','PATCH']:
                    if state['race']:
                        state['race']=False
                        state['row']['revision']+=1
                        r.fulfill(json=[]);return
                    state['writes']+=1
                    data=req.post_data_json
                    if req.method=='PATCH':
                        assert 'revision=eq.'+str(state['row']['revision']) in url
                    state['row']=dict(data)
                body=[state['row']] if state['row'] else []
            r.fulfill(json=body);return
        if 'api.midvash.com/' in url:
            r.fulfill(json={'verses':[{'number':1,'text':'Texto de teste <seguro>'}]});return
        r.abort()
    ctx.route('**/*',route)
    page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
    page.goto('https://shema.test/v9/index.html')
    assert page.evaluate('PH.length')==365
    assert page.evaluate('REGION_INFO.length')==20
    assert page.evaluate('bibleBooks.length')==66
    assert page.evaluate('PH.every(d=>d[5].includes(d[4]) && bibleBooks.some(b=>b[1]===d[10] && d[11]>=1 && d[11]<=b[2]))')
    assert page.evaluate('REGION_INFO.every((r,i)=>r.start===(i?REGION_INFO[i-1].end+1:1)) && REGION_INFO.at(-1).end===365')
    print('PASS: 365 casas, 20 regiões contínuas, 66 livros, alternativas e capítulos válidos')
    page.evaluate("localStorage.setItem('shemaXP','777');localStorage.setItem('shemaPlayable','[true]')")
    def finish(n):
        page.evaluate('n=>phOpen(n)',n)
        page.evaluate("() => { const i=PH[phN-1][5].indexOf(PH[phN-1][4]); phChoose(document.querySelectorAll('#phOptions button')[i],i);document.getElementById('phCommit').checked=true;phFinish(); }")
    page.evaluate('phOpen(5)');assert page.evaluate('phN')==1
    for n in range(1,5):finish(n)
    assert page.evaluate('phN')==5
    assert page.evaluate('phUnlocked()')==5
    old=page.evaluate('xp');finish(4);assert page.evaluate('xp')==old
    assert page.evaluate("localStorage.getItem('shemaXP')")=='777'
    assert page.evaluate("localStorage.getItem('shemaPlayable')")=='[true]'
    page.reload();assert page.evaluate('phUnlocked()')==5
    page.evaluate("shemaV9Storage.setItem('shemaPlayable',JSON.stringify(Array.from({length:365},(_,i)=>i<363)))")
    finish(364);assert page.evaluate('phN')==365
    finish(365);assert page.evaluate('phProgress().every(Boolean)')
    page.evaluate('phOpen(0);phOpen(366)')
    print('PASS: bloqueio, casas 4→5 e 364→365, conclusão, XP único, persistência e V7 isolada')
    page.evaluate("go('bible');document.getElementById('bibleBook').value='0';updateBibleChapters();document.getElementById('bibleChapter').value='1';loadBibleChapter()")
    page.wait_for_function("document.querySelector('#bibleText .verse')")
    assert '<seguro>' in page.locator('#bibleText').inner_text()
    assert page.locator('#bibleText seguro').count()==0
    ctx.set_offline(True);page.evaluate('loadBibleChapter()');page.wait_for_function("document.getElementById('bibleStatus').textContent.includes('offline')")
    page.evaluate("document.getElementById('bibleChapter').value='2';loadBibleChapter()")
    page.wait_for_function("document.getElementById('bibleStatus').textContent.includes('ainda não foi salvo')")
    ctx.set_offline(False)
    print('PASS: leitor online simulado, escape HTML, cache offline e capítulo ausente')
    page.evaluate("go('profile')")
    page.fill('#shemaCloudEmail','test@example.invalid')
    for password in ['', 'abc123', 'a'*11, ' '*12]:
        page.fill('#shemaCloudPassword',password);page.click('#shemaCloudSignup')
        assert state['signups']==0
    page.fill('#shemaCloudPassword','a'*12);page.click('#shemaCloudSignup')
    page.wait_for_function("document.getElementById('shemaCloudStatus').textContent.includes('Cadastro solicitado')")
    assert state['signups']==1
    # Login legado continua permitindo senhas existentes menores que 12.
    page.fill('#shemaCloudPassword','antiga')
    page.click('#shemaCloudLogin');page.wait_for_function("!document.getElementById('shemaCloudAuthed').hidden")
    page.click('#shemaCloudSave');page.wait_for_function("document.getElementById('shemaCloudStatus').textContent.includes('Progresso salvo')")
    assert state['writes']==1
    page.click('#shemaCloudAuto')
    page.wait_for_function("document.getElementById('shemaCloudAutoStatus').textContent.includes('Ativa')")
    page.evaluate("shemaV9Storage.setItem('shemaName','Teste automático')")
    page.wait_for_function("document.getElementById('shemaCloudAutoStatus').textContent.includes('Salvo automaticamente')",timeout=15000)
    assert state['writes']==2
    state['row']['revision']+=1
    page.click('#shemaCloudSave');page.wait_for_function("document.getElementById('shemaCloudStatus').textContent.includes('Outra sessão')")
    assert state['writes']==2
    page.click('#shemaCloudLoad')
    page.wait_for_function("document.getElementById('shemaCloudStatus').textContent.includes('Conectado')")
    assert page.evaluate("shemaV9Storage.getItem('shemaName')")=='Teste automático'
    page.evaluate("{let s=JSON.parse(sessionStorage.getItem('shema-v9-laboratorio::sessao'));s.expires_at=0;sessionStorage.setItem('shema-v9-laboratorio::sessao',JSON.stringify(s))}")
    page.reload()
    page.wait_for_function("document.getElementById('shemaCloudStatus').textContent.includes('Conectado')")
    assert state['refreshes']==1
    print('PASS: sincronização automática, recuperação remota e renovação de sessão simuladas')
    page.evaluate("go('profile')")
    before=state['writes']
    local=page.evaluate('ShemaCloudLab.capture().values')
    state['race']=True
    page.click('#shemaCloudSave')
    page.wait_for_function("document.getElementById('shemaCloudStatus').textContent.includes('Conflito:')")
    assert state['writes']==before
    assert page.evaluate('ShemaCloudLab.capture().values')==local
    for code in [401,403,500]:
        state['fault']=code
        page.click('#shemaCloudSave')
        page.wait_for_function("document.getElementById('shemaCloudStatus').textContent.includes('Não foi possível salvar')")
        page.wait_for_function("!document.getElementById('shemaCloudSave').disabled")
        assert state['writes']==before
        assert page.evaluate('ShemaCloudLab.capture().values')==local
    state['fault']=None
    print('PASS: cadastro mínimo 12, login legado, corrida CAS e falhas 401/403/500 preservam dados')
    for bad in [{'schema':2,'values':{}},{'schema':1,'values':{'evil':'x'}},{'schema':1,'values':{'shemaXP':2}}, {'schema':1,'values':{'shemaXP':'x'*3_000_001}}]:
        assert page.evaluate('(x)=>{try{ShemaCloudLab.validSnapshot(x);return false}catch{return true}}',bad)
    page.evaluate("go('profile')")
    page.click('#shemaCloudSignout');page.wait_for_function("!document.getElementById('shemaCloudGuest').hidden")
    assert page.evaluate("sessionStorage.getItem('shema-v9-laboratorio::sessao')") is None
    print('PASS: login, primeira gravação, conflito sem sobrescrita, backups inválidos e logout (HTTP simulado)')
    for width in [320,390,768]:
        page.set_viewport_size({'width':width,'height':900});page.evaluate("go('home')")
        assert page.locator('.nav').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert not errors, errors
    print('PASS: larguras 320/390/768, sem overflow horizontal nem erros JavaScript')
    browser.close()
