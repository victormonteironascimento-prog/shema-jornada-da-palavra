"""Generate a separate, cloud-disabled production review artifact. Never deploys."""
import argparse
import json
import shutil
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

def prepare(config_path, output):
    config = json.loads(Path(config_path).read_text())
    expected = {'environment': 'production', 'cloudEnabled': False,
                'supabaseUrl': 'https://ghzvomquldrqpsosvbig.supabase.co', 'publishableKey': ''}
    if config != expected:
        raise ValueError('Somente configuração de produção com nuvem desativada e sem chave é permitida nesta RC.')
    output = Path(output).resolve()
    if output == ROOT or ROOT in output.parents and not output.is_relative_to(ROOT/'work'):
        raise ValueError('Use um diretório novo em work/ ou fora do repositório.')
    if output.exists():
        raise ValueError('Destino já existe; não sobrescrever dados.')
    shutil.copytree(ROOT/'v9', output)
    (output/'config.js').write_text('window.SHEMA_CONFIG = Object.freeze('+json.dumps(config)+');\n')
    manifest = json.loads((output/'app.webmanifest').read_text())
    manifest.update(name='Shema V9 — Candidata de produção (nuvem desativada)', short_name='Shema RC')
    (output/'app.webmanifest').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
    return output

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config',default=str(ROOT/'config/production.example.json'))
    parser.add_argument('--output',required=True)
    args=parser.parse_args()
    print(prepare(args.config,args.output))
