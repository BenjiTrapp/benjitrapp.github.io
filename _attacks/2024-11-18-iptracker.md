---
layout: attack
title: Recon using a Tracking pixel
---

<img height="150" align="left" src="/images/tracking_pixel.png"> > "Technology is best when it brings people together." — Matt Mullenweg

The digital world thrives on connection, with devices linking across the globe in an intricate dance of data and communication. Hidden within this interconnected web are invisible tools that allow us to track, analyze, and understand user behavior. One such tool combines the simplicity of a transparent image and the ingenuity of IP tracking. With IP tracking it's also possible to gain insights on the possible target infrastructure including ip ranges, location and more.


## **What Am I?**  
> **I am an unseen guide, leading from your screen to mine.**  
> **Hint:** It's the address that makes your computer find.

In cyberspace, your device leaves behind a digital footprint called an **IP address**. This unique identifier functions like a home address, enabling devices to locate and interact with each other. But what happens when an **invisible tool** sneaks a peek at this address?


### **What Is a Transparent Image?**

A **transparent image** is an image with no visible content — essentially an empty picture. Often just a pixel in size, it's commonly used in tracking. When embedded in an email or webpage, it works covertly to gather information without being noticed.

### **How Does IP Tracking Work?**

1. **The Role of the Transparent Image**  
   When a user interacts with an email, webpage, or QR code containing a transparent image, their device automatically requests the image from a remote server.

2. **The IP Address in Action**  
   This request reveals the device's **IP address**, which the server logs. The logged IP address provides insights into the user's location and internet service provider.

3. **What Happens Next?**  
   Using tools like **IP Logger**, the logged data can be monitored and analyzed for security purposes, analytics, or marketing.

---

## Tracking Pixel Options at a Glance

| Method | Hosting Required | Difficulty | Stealth | Customizable | Best For |
|--------|:---:|:---:|:---:|:---:|--------|
| **Self-hosted (Flask)** | Yes | Medium | High | Full | Red team ops, full control |
| **Self-hosted (PHP)** | Yes | Easy | High | Full | Quick deploy on shared hosting |
| **Canarytokens** | No | Easy | High | Limited | Tripwires, honeypots |
| **Grabify / IP Logger** | No | Easy | Low | Limited | Quick & dirty recon |
| **Webhook.site** | No | Easy | Medium | Limited | Rapid prototyping |
| **CSS-based tracking** | Yes | Medium | Very High | Medium | Bypassing image-blocking clients |

---

## Option 1: DIY with Python (ImgBB + IP Logger)

### **Step 1: Generate a Transparent Image**  
Using Python's `Pillow` library, we can create a single-pixel transparent image:  

```python
from PIL import Image

# Create a 1x1 transparent PNG
img = Image.new('RGBA', (1, 1), (0, 0, 0, 0))
img.save('transparent.png')
print("[+] Transparent tracking pixel created: transparent.png")
```

### **Step 2: Host the Image Online**

The image needs to be hosted on a platform accessible to users. Services like [ImgBB](https://imgbb.com/) allow quick image uploads via their API:

```python
import requests

upload_url = 'https://api.imgbb.com/1/upload'
api_key = 'YOUR_IMGBB_API_KEY'
image_path = 'transparent.png'

with open(image_path, 'rb') as img_file:
    response = requests.post(
        upload_url,
        data={'key': api_key},
        files={'image': img_file}
    )
    response.raise_for_status()
    img_url = response.json()['data']['url']

print(f'[+] Image URL: {img_url}')
```

### **Step 3: Link to IP Logger**

Using the hosted image URL, generate a tracking URL with a service like [IP Logger](https://iplogger.org/):

```python
ip_logger_url = (
    f'https://iplogger.org/api/get'
    f'?apiKey=YOUR_IP_LOGGER_API_KEY'
    f'&generateImage=1'
    f'&customImageURL={img_url}'
)

response = requests.get(ip_logger_url)
response.raise_for_status()
tracking_url = response.json()['result']['url']

print(f'[+] Your tracking URL is: {tracking_url}')
```

### How to Use the Tracking URL
1. **Embed in Emails**: Include the `tracking_url` in an email using an `<img>` tag. When the recipient opens the email, the image loads, logging their IP address.
2. **Create a QR Code**: Generate a QR code linking to the `tracking_url`. Anyone scanning it will trigger the same logging process.
3. **Monitor IP Logs**: Log in to your IP Logger account to view logged IP addresses, along with timestamps and location details.

---

## Option 2: Self-Hosted Flask Tracker (Full Control)

Running your own tracking server gives you complete control over logging and avoids third-party dependencies. This is the preferred method for red team operations.

```python
from flask import Flask, request, send_file, jsonify
from datetime import datetime
import json
import io

app = Flask(__name__)
LOG_FILE = 'access_log.json'

def log_request(route_id):
    """Log visitor details to JSON file."""
    entry = {
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'route': route_id,
        'ip': request.headers.get('X-Forwarded-For', request.remote_addr),
        'user_agent': request.headers.get('User-Agent'),
        'referer': request.headers.get('Referer'),
        'accept_language': request.headers.get('Accept-Language'),
        'headers': dict(request.headers)
    }

    try:
        with open(LOG_FILE, 'r') as f:
            logs = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        logs = []

    logs.append(entry)

    with open(LOG_FILE, 'w') as f:
        json.dump(logs, f, indent=2)

    return entry

@app.route('/pixel/<route_id>.png')
def tracking_pixel(route_id):
    """Serve a 1x1 transparent PNG and log the request."""
    entry = log_request(route_id)
    print(f"[+] Hit from {entry['ip']} on /{route_id}")

    # 1x1 transparent PNG bytes
    pixel = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01'
        b'\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89'
        b'\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01'
        b'\r\n\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    )

    return send_file(
        io.BytesIO(pixel),
        mimetype='image/png',
        headers={
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    )

@app.route('/logs')
def view_logs():
    """View collected logs (protect this in production!)."""
    try:
        with open(LOG_FILE, 'r') as f:
            return jsonify(json.load(f))
    except FileNotFoundError:
        return jsonify([])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
```

**Usage:** Deploy this behind an HTTPS reverse proxy (e.g. nginx + Let's Encrypt), then embed:

```html
<img src="https://your-server.com/pixel/campaign01.png" width="1" height="1" style="display:none" />
```

Each unique `route_id` lets you track different campaigns or targets separately. The `Cache-Control` headers ensure the pixel is fetched on every open, not served from cache.

---

## Option 3: Self-Hosted PHP Tracker (Shared Hosting)

If you have access to any basic PHP hosting (even free-tier shared hosting), this is the fastest way to deploy a tracking pixel:

```php
<?php
// tracker.php - Simple tracking pixel with IP logging
$log_file = __DIR__ . '/access_log.csv';

$data = [
    date('Y-m-d H:i:s'),
    $_GET['id'] ?? 'unknown',
    $_SERVER['REMOTE_ADDR'],
    $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '',
    $_SERVER['HTTP_USER_AGENT'] ?? '',
    $_SERVER['HTTP_REFERER'] ?? '',
    $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? ''
];

// Append to CSV log
$fp = fopen($log_file, 'a');
fputcsv($fp, $data);
fclose($fp);

// Serve 1x1 transparent GIF (smallest possible: 43 bytes)
header('Content-Type: image/gif');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
?>
```

**Usage:** Upload `tracker.php` to your server, then embed:

```html
<img src="https://your-server.com/tracker.php?id=target01" width="1" height="1" />
```

The CSV log is easy to analyze with standard tools or import into a spreadsheet.

---

## Option 4: Canarytokens (Zero Infrastructure)

[Canarytokens](https://canarytokens.org/generate) are free honeytokens maintained by Thinkst. They require zero infrastructure and provide email alerts when triggered. I covered this in depth in a [previous post about Canarytokens](https://benjitrapp.github.io/canarytoken-fun/).

**How to create a tracking pixel with Canarytokens:**

1. Visit [canarytokens.org/generate](https://canarytokens.org/generate)
2. Select **"Web bug / URL token"** from the dropdown
3. Enter your alert email address and a memo (e.g. "Phishing campaign test")
4. Click **Create my Canarytoken**
5. Copy the generated URL

```html
<!-- Embed in email or webpage -->
<img src="https://canarytokens.com/feedback/YOUR_TOKEN/index.html"
     width="1" height="1" style="display:none" />
```

**Pros:**
- No server needed, completely free
- Instant email alerts with IP, User-Agent, and geolocation
- Supports many token types beyond web bugs (AWS keys, DNS, Word docs, etc.)
- Battle-tested and maintained by Thinkst

**Cons:**
- Limited customization of logged data
- You don't control the infrastructure
- No API for bulk creation (in the free tier)

---

## Option 5: Grabify / IP Logger (Quick & Dirty)

Services like [Grabify](https://grabify.link/) and [IP Logger](https://iplogger.org/) let you create tracking links in seconds with no coding:

1. Paste any URL into Grabify/IP Logger
2. Get a shortened tracking link back
3. Share the link — every click is logged with IP, User-Agent, referrer, screen resolution, and more

**Grabify** also offers a "Smart Logger" that can be embedded as an image:

```html
<img src="https://grabify.link/XXXXX" width="1" height="1" />
```

**Pros:**
- Zero setup, instant results
- Rich metadata (device type, OS, browser, screen resolution)
- Dashboard with maps and analytics

**Cons:**
- Domains are widely known and often blocked by security tools
- URLs can be flagged by email providers
- Data is stored on a third party — not suitable for sensitive ops
- Low stealth factor

---

## Option 6: Webhook.site (Rapid Prototyping)

[Webhook.site](https://webhook.site/) gives you a unique URL that logs every request with full headers. Useful for quick tests:

1. Visit [webhook.site](https://webhook.site/) — you get a unique URL instantly
2. Embed it as an image source:

```html
<img src="https://webhook.site/YOUR-UUID" width="1" height="1" />
```

3. Watch requests arrive in real-time on the dashboard

This is great for prototyping and testing, but the URLs expire and the domain is well-known to security tools.

---

## Option 7: CSS-Based Tracking (No Images Needed)

Some email clients block images by default but still load CSS. This technique uses CSS `background-image` or `url()` to trigger a request without an `<img>` tag:

```html
<div style="background-image: url('https://your-server.com/pixel/css-track.png');
            width: 1px; height: 1px; position: absolute; left: -9999px;">
</div>
```

Or using an embedded `<style>` block:

```html
<style>
  .tracker { background: url('https://your-server.com/pixel/css-track.png') no-repeat; }
</style>
<div class="tracker" style="width:1px;height:1px;overflow:hidden;"></div>
```

**Pros:**
- Works even when image loading is disabled (in some clients)
- Harder to detect through casual inspection
- Very high stealth factor

**Cons:**
- Not all email clients support CSS `background-image` (Outlook strips it)
- Effectiveness varies significantly across clients
- Web-based email (Gmail, Yahoo) may proxy or strip these

---

## Generating QR Codes for Any Tracking URL

Any of the tracking URLs above can be turned into a QR code for physical distribution:

```python
import qrcode

tracking_url = 'https://your-server.com/pixel/campaign01.png'

qr = qrcode.QRCode(version=1, box_size=10, border=4)
qr.add_data(tracking_url)
qr.make(fit=True)

img = qr.make_image(fill_color="black", back_color="white")
img.save('tracking_qr.png')
print("[+] QR code saved as tracking_qr.png")
```

Print it, paste it on a flyer, or include it in a phishing exercise. When scanned, the user's phone fetches the tracking pixel.

---

## Detection and Countermeasures

Understanding tracking pixels isn't just about offense — defenders should know how to spot and block them:

| Countermeasure | Effect |
|------|--------|
| **Disable auto-loading images** in email clients | Blocks all image-based tracking |
| **Use a VPN or Tor** | Masks your real IP address |
| **Email privacy proxies** (Apple Mail Privacy Protection, Proton Mail) | Preloads images through a proxy |
| **Browser extensions** (uBlock Origin, Privacy Badger) | Block known tracking domains |
| **Content Security Policy (CSP)** headers | Restrict which domains can serve images |
| **Inspect email source** | Look for hidden `<img>` tags with suspicious URLs |

---

## Final Thoughts

The combination of a transparent image and IP tracking demonstrates how seemingly simple tools can have profound applications in cybersecurity, analytics, and beyond. Whether you go with a managed service like Canarytokens for convenience or roll your own Flask server for full operational control, the core technique remains the same: an invisible request that quietly reveals who's watching.

By understanding these mechanisms — both how to build them and how to defend against them — we can better appreciate the balance between connectivity and privacy in the digital age.
