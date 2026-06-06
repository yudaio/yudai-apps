import urllib.request, ssl, time
ssl_ctx = ssl.create_default_context()
url = "https://image.pollinations.ai/prompt/cat?width=64&height=64&nologo=true&model=flux"
print("Testing: " + url)
t = time.time()
try:
    req = urllib.request.Request(url, method="GET")
    req.add_header("User-Agent", "Mozilla/5.0 (compatible; AI-Studio-Proxy/1.0)")
    with urllib.request.urlopen(req, timeout=30, context=ssl_ctx) as resp:
        data = resp.read()
        ct = resp.headers.get("Content-Type", "")
        print("OK: status=" + str(resp.status) + " bytes=" + str(len(data)) + " ct=" + ct + " time=" + str(round(time.time()-t, 2)) + "s")
except Exception as e:
    print("ERROR: " + str(e))
