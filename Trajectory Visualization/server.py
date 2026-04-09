#!/usr/bin/env python3
"""
Simple HTTP Server for IPEDS Visualization
Serves static files and provides CORS support
"""

import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

class CORSRequestHandler(SimpleHTTPRequestHandler):
    """HTTP request handler with CORS support"""
    
    def end_headers(self):
        """Add CORS headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()
    
    def log_message(self, format, *args):
        """Log only important messages"""
        message = str(args[0]) if args else ""
        if '200' in message or 'error' in message.lower() or 'GET' in message:
            print(f"[{self.log_date_time_string()}] {format % args}")

def run_server(port=8000):
    """Start HTTP server"""
    # Change to visualization directory
    viz_dir = Path(__file__).parent.absolute()
    os.chdir(viz_dir)
    
    server_address = ('', port)
    httpd = HTTPServer(server_address, CORSRequestHandler)
    
    print(f"╔{'═' * 60}╗")
    print(f"║ IPEDS 可视化 - 本地开发服务器                    ║")
    print(f"║ 启动成功！                                      ║")
    print(f"║                                                  ║")
    print(f"║ 访问地址: http://localhost:{port}  ║")
    print(f"║ 按 Ctrl+C 停止服务                             ║")
    print(f"╚{'═' * 60}╝")
    print()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n服务已停止")
        sys.exit(0)

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)
