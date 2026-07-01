#!/bin/bash
# Quick test: attempt instagrapi login and confirm session
cd ~/Projects/trackpass
IG_PASSWORD="Golf2026!" python3 - << 'PYEOF'
import warnings; warnings.filterwarnings('ignore')
import json, pathlib
from instagrapi import Client

SESSION_FILE = pathlib.Path('.ig-session.json')
cl = Client()
cl.delay_range = [2, 4]

# Try session first if it exists
if SESSION_FILE.exists():
    try:
        cl.set_settings(json.loads(SESSION_FILE.read_text()))
        cl.login('trackpassgolf', 'Golf2026!')
        info = cl.account_info()
        print(f'OK - @{info.username} | {info.follower_count} followers | {info.media_count} posts')
        SESSION_FILE.write_text(json.dumps(cl.get_settings()))
        exit(0)
    except Exception as e:
        print(f'Session expired, re-logging: {e}')

# Fresh login
try:
    cl.login('trackpassgolf', 'Golf2026!')
    SESSION_FILE.write_text(json.dumps(cl.get_settings()))
    info = cl.account_info()
    print(f'OK - @{info.username} | {info.follower_count} followers | {info.media_count} posts')
except Exception as e:
    print(f'FAILED: {type(e).__name__}: {e}')
    exit(1)
PYEOF
