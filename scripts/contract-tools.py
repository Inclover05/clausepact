"""Use official legacy SDK bytes with tools that expect the pre-manager layout.
No contract or SDK contents are changed. This adapter only remaps archive paths.
"""
from pathlib import Path
import sys, tarfile, os, json
ROOT=Path(__file__).resolve().parent.parent
CACHE=ROOT/'tmp'/'genvm-tools-cache'
VERSION='v0.2.17-legacy-layout'

def prepare():
    CACHE.mkdir(parents=True,exist_ok=True)
    destination=CACHE/f'genvm-universal-{VERSION}.tar.xz'
    if not destination.exists():
        source=Path.home()/'.cache'/'genvm-linter'/'genvm-universal-genlayerlabs-genvm-manager-v0.6.0-rc5.tar.xz'
        if not source.exists():
            raise SystemExit('Official GenVM manager artifact not cached. Run genvm-lint download first.')
        prefix='executor/v0.2.17/legacy-runners/'
        partial=destination.with_suffix('.partial')
        with tarfile.open(source,'r|xz') as original,tarfile.open(partial,'w:xz') as compatible:
            for member in original:
                if member.isfile() and member.name.startswith(prefix) and member.name.endswith('.tar') and '/cpython/' not in member.name and '/models-' not in member.name:
                    data=original.extractfile(member)
                    mapped=tarfile.TarInfo('runners/'+member.name[len(prefix):]);mapped.size=member.size
                    compatible.addfile(mapped,data)
        partial.replace(destination)
    import genvm_linter.validate.artifacts as artifacts
    import gltest.direct.sdk_loader as loader
    artifacts.CACHE_DIR=CACHE
    loader.CACHE_DIR=CACHE
    os.environ['GENVM_VERSION']=VERSION
    return destination

if __name__=='__main__':
    prepare()
    if len(sys.argv)>1 and sys.argv[1]=='test':
        os.environ["PYTEST_DISABLE_PLUGIN_AUTOLOAD"] = "1"
        import pytest
        # Windows cannot unlink the message file while fd 0 still holds it open.
        # Defer only that WinError 32 cleanup; retain the official SDK and runner.
        pending = []
        if os.name == 'nt':
            from unittest.mock import patch
            import gltest.direct.loader as direct_loader
            original_inject = direct_loader._inject_message_to_fd0
            original_unlink = os.unlink
            def delayed_unlink(path, *args, **kwargs):
                try:
                    return original_unlink(path, *args, **kwargs)
                except PermissionError as error:
                    if error.winerror != 32:
                        raise
                    pending.append(path)
            def windows_inject(vm):
                with patch('os.unlink', delayed_unlink):
                    return original_inject(vm)
            direct_loader._inject_message_to_fd0 = windows_inject
        status = pytest.main(['tests/direct','-v','-p','gltest.direct.pytest_plugin',*sys.argv[2:]])
        for path in pending:
            try:
                os.unlink(path)
            except FileNotFoundError:
                pass
        raise SystemExit(status)
    from genvm_linter.cli import main
    main(['check','contracts/scopelock.py','--json'])




