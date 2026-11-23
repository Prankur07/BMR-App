#!/usr/bin/env python3
"""
Production server: serves frontend/dist and proxies /api to backend:8000
"""
import http.server
import socketserver
import urllib.request
import urllib.error
import json
import sys
import os

BACKEND_URL = "http://localhost:8000"
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "frontend", "dist")
PORT = 3000

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def do_GET(self):
        if self.path.startswith("/api/"):
            self.proxy_request()
        else:
            # Serve frontend (SPA fallback to index.html)
            if not self.path.startswith("/assets/") and not self.path.startswith("/manifest") and not self.path.startswith("/registerSW") and not self.path.startswith("/vite.svg") and not self.path.startswith("/apple-touch-icon") and not self.path.startswith("/pwa-"):
                self.path = "/index.html"
            super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api/"):
            self.proxy_request()
        else:
            self.send_error(404)

    def do_OPTIONS(self):
        if self.path.startswith("/api/"):
            self.proxy_request()
        else:
            self.send_error(404)

    def proxy_request(self):
        url = BACKEND_URL + self.path
        
        # Read request body
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else None
        
        # Build request
        req = urllib.request.Request(url, data=body, method=self.command)
        
        # Forward headers (except host)
        for header, value in self.headers.items():
            if header.lower() not in ('host', 'content-length'):
                req.add_header(header, value)
        
        try:
            with urllib.request.urlopen(req) as response:
                self.send_response(response.status)
                for header, value in response.headers.items():
                    if header.lower() not in ('transfer-encoding', 'content-encoding'):
                        self.send_header(header, value)
                self.end_headers()
                self.wfile.write(response.read())
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            for header, value in e.headers.items():
                self.send_header(header, value)
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_response(502)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def log_message(self, format, *args):
        # Suppress default log messages
        pass

if __name__ == "__main__":
    os.chdir(os.path.dirname(__file__))
    
    with socketserver.TCPServer(("", PORT), ProxyHandler) as httpd:
        print(f"Production server running on http://0.0.0.0:{PORT}")
        print(f"  Frontend: {FRONTEND_DIR}")
        print(f"  API Proxy: /api/* -> {BACKEND_URL}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down...")
            sys.exit(0)