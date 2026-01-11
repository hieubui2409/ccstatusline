#!/usr/bin/env python3
"""Extract Claude.ai sessionKey from browser cookies.

Usage:
    python3 scripts/extract-session-key.py

Output (JSON):
    {"sessionKey": "sk-ant-sid01-...", "organizationId": "...", "browser": "chrome"}
    or
    {"error": "..."}

Requires:
    pip install browser-cookie3
"""

import json
import sys


def extract_session_key():
    """Try Chrome, Firefox, Edge, Chromium in order."""
    try:
        import browser_cookie3
    except ImportError:
        print(json.dumps({
            "error": "browser_cookie3 not installed",
            "install": "pip install browser-cookie3"
        }))
        sys.exit(1)

    browsers = [
        ("chrome", browser_cookie3.chrome),
        ("firefox", browser_cookie3.firefox),
        ("edge", browser_cookie3.edge),
        ("chromium", browser_cookie3.chromium),
    ]

    for name, browser_func in browsers:
        try:
            cj = browser_func(domain_name='.claude.ai')
            session_key = None
            org_id = None

            for cookie in cj:
                if cookie.name == 'sessionKey':
                    session_key = cookie.value
                elif cookie.name == 'lastActiveOrg':
                    org_id = cookie.value

            if session_key:
                result = {
                    "sessionKey": session_key,
                    "browser": name
                }
                if org_id:
                    result["organizationId"] = org_id
                print(json.dumps(result))
                return

        except PermissionError:
            # Browser might be running, skip
            continue
        except Exception:
            # Browser not installed or other error
            continue

    print(json.dumps({"error": "No Claude.ai session found in any browser"}))
    sys.exit(1)


if __name__ == "__main__":
    extract_session_key()
