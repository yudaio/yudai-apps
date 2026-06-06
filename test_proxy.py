import urllib.request, time
url = "http://localhost:8080/polapi/prompt/cat?width=64&height=64&nologo=true&model=flux"
print("Testing proxy: " + url)
t = time.time()
try:
    with urllib.request.urlopen(url, timeout=20) as resp:
        data = resp.read()
        ct = resp.headers.get("Content-Type", "")
        print("OK: status=" + str(resp.status) + " bytes=" + str(len(data)) + " ct=" + ct + " time=" + str(round(time.time()-t, 2)) + "s")
except Exception as e:
    print("ERROR: " + str(e))
