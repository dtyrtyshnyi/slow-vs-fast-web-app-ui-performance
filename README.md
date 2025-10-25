# Slow vs. Fast Web App: A UI/API Performance Testbed

This repository contains a set of "bad" (slow) and "good" (fast) web applications designed specifically for performance testing. It serves as an experimental testbed for the client-side performance analysis, demonstrating how various bottlenecks on both the front-end and back-end impact the end-user experience.

The applications simulate a simple e-commerce "Black Friday" sale page, intentionally built with common performance anti-patterns (in the "bad" version) and then fixed (in the "good" version).

## Key Bottlenecks Simulated

### 📉 v1 "Bad" Application

  * **Server-Side (API):**
      * **Blocking Main Thread:** A synchronous `blockMainThread(100)` function simulates a heavy, blocking operation (like a complex DB query or calculation) on the Node.js event loop.
      * **Error Rate:** A `5%` chance of returning an `HTTP 500` error to simulate server instability under load.
  * **Client-Side (UI):**
      * **Render-Blocking Resources:** CSS and JS are loaded in the `<head>` without `defer` or `async`.
      * **Client-Side Blocking:** A synchronous `blockClientThread(200)` function runs on the main thread, freezing the UI and worsening the **Total Blocking Time (TBT)**.
      * **Sequential Image Loading:** Images are loaded one-by-one using `await` in a `for...of` loop, creating a "waterfall" network request chain instead of parallel downloads.
      * **Layout Shift (CLS):** A dynamic banner and product grid are loaded without placeholder spacing, causing significant content "jumps."
      * **Unoptimized Images:** Uses large, uncompressed `.png` files.

### 📈 v2 "Good" Application

  * **Server-Side (API):**
      * All blocking code and artificial error rates are removed.
      * Serves paths to optimized images.
  * **Client-Side (UI):**
      * **Non-Blocking Resources:** JS is moved to the end of `<body>` with `defer`. CSS is preloaded.
      * **No Client-Side Blocking:** Synchronous JS is removed.
      * **Parallel Image Loading:** Uses `Promise.all()` to download all images in parallel.
      * **No Layout Shift (CLS):** Uses CSS `aspect-ratio` and "skeleton" placeholders to reserve space for all dynamic content.
      * **Optimized Images:** Serves modern, compressed `.webp` images.
      * **Efficient DOM Rendering:** Uses a `DocumentFragment` to append all product cards in a single DOM operation.

-----

## Project Structure

```
/
├── api/
│   ├── v1_bad_api/     # (Port 4000) Node.js API with server-side bottlenecks
│   └── v2_good_api/    # (Port 4001) Optimized Node.js API
└── ui/
    ├── v1_bad_ui/      # (Port 8080) Front-end with client-side bottlenecks
    └── v2_good_ui/     # (Port 8081) Optimized front-end
```

-----

## 🛠️ Setup and Installation

### Prerequisites

  * [Node.js](https://nodejs.org/) (v18.x or later recommended)
  * [npm](https://www.npmjs.com/) (comes with Node.js)
  * [Docker Desktop](https://www.docker.com/products/docker-desktop/) (required for Sitespeed.io testing)
  * [Apache JMeter](https://jmeter.apache.org/download_jmeter.cgi) (optional, for "Black Friday" load testing)
  * A global installation of `http-server`:
    ```bash
    npm install -g http-server
    ```

### 1\. Install Dependencies

You only need to install dependencies for the two API servers.

```bash
# Clone the repository
git clone https://github.com/dtyrtyshnyi/slow-vs-fast-web-app-ui-performance.git
cd slow-vs-fast-web-app-ui-performance

# Install 'bad' API dependencies
cd slow_web_app
npm install
cd ../..

# Install 'good' API dependencies
cd fast_web_app
npm install
cd ../..
```

-----

## 🚀 Running the Full Experiment

You will need **4 separate terminal windows** to run the complete environment.

### Step 1: Run the Back-end APIs

💻 **Terminal 1: Start the "Bad" API**

```bash
cd slow_web_app
node server.js
# ➡️ 'Bad API' server running on http://localhost:4000
```

💻 **Terminal 2: Start the "Good" API**

```bash
cd fast_web_app
node server.js
# ➡️ ✨ 'Good API' server running on http://localhost:4001
```

### Step 2: Configure the Front-end (CRITICAL)

The UI (`script.js`) needs to know the IP address of your API server.

**Option A: Testing from your own machine (Browser or Docker)**

1.  Open `slow_web_app/script.js`.
2.  Set `API_HOST` for Docker:
    ```javascript
    const API_HOST = 'localhost:4000'; // locally
    const API_HOST = 'host.docker.internal:4000'; // For Docker
    ```
3.  Open `fast_web_app/script.js`.
4.  Set `API_HOST` for Docker:
    ```javascript
    const API_HOST = 'localhost:4001'; // locally
    const API_HOST = 'host.docker.internal:4001'; // For Docker
    ```

**Option B: Testing from another device on the same network**

1.  Find your local IP address (e.g., `192.168.0.103`).
      * **Windows:** `ipconfig`
      * **Mac/Linux:** `ifconfig` or `ip addr`
2.  Open `slow_web_app/script.js`.
3.  Set `API_HOST` to your IP:
    ```javascript
    const API_HOST = '192.168.0.103:4000'; // Your host IP
    ```
4.  Open `fast_web_app/script.js`.
5.  Set `API_HOST` to your IP:
    ```javascript
    const API_HOST = '192.168.0.103:4001'; // Your host IP
    ```

### Step 3: Run the Front-end Servers

💻 **Terminal 3: Start the "Bad" UI**

```bash
cd slow_web_app
http-server -p 8080
# ➡️ Available on: http://localhost:8080
```

💻 **Terminal 4: Start the "Good" UI**

```bash
cd fast_web_app
http-server -p 8081
# ➡️ Available on: http://localhost:8081
```

### Summary of Local Ports

| Service | Location | Port | URL for Browser |
| :--- | :--- | :--- | :--- |
| **Bad API** | `slow_web_app` | `4000` | `http://<YOUR_IP>:4000` |
| **Good API** | `fast_web_app` | `4001` | `http://<YOUR_IP>:4001` |
| **Bad UI** | `slow_web_app` | `8080` | `http://<YOUR_IP>:8080` |
| **Good UI** | `fast_web_app` | `8081` | `http://<YOUR_IP>:8081` |

-----

## 📊 How to Test

### Scenario 1: Manual Browser Testing

Open the URLs in your browser (e.g., `http://localhost:8080`) and inspect the Network tab and Performance tab in Chrome DevTools.

### Scenario 2: Automated Performance Testing (Sitespeed.io)

Run this command from the **root directory** of the repository. This saves the report to a `sitespeed-result` folder.

```bash
# Test the "Bad" App (3 runs)
docker run --rm -v "$(pwd):/sitespeed.io" sitespeedio/sitespeed.io:latest http://localhost:8080/index.html -n 3 --slug bad-app-test

# Test the "Good" App (3 runs)
docker run --rm -v "$(pwd):/sitespeed.io" sitespeedio/sitespeed.io:latest http://localhost:8081/index.html -n 3 --slug good-app-test
```

### Scenario 3: The "Black Friday" Load Test (JMeter + Sitespeed)

This is the key experiment to show how back-end load kills front-end UX.

1.  **Start JMeter:**

      * Open JMeter.
      * Create a **Thread Group** (e.g., 50 users, 5-second ramp-up, Infinite loop).
      * Add an **HTTP Request** sampler pointing to the **"Bad" API**:
          * **Server:** `localhost` (or your IP `192.168.X.X` if JMeter is on another machine)
          * **Port:** `4000`
          * **Path:** `/api/products`
      * Add a **Summary Report** listener.
      * Press **Start** to begin the load test.

2.  **Run Sitespeed.io *during* the load:**

      * While JMeter is running and overwhelming the bad API, run your Sitespeed.io test on the **"Bad" UI**:

    <!-- end list -->

    ```bash
    docker run --rm -v "$(pwd):/sitespeed.io" sitespeedio/sitespeed.io:latest http://localhost:8080/index.html -n 3 --slug black-friday-TEST
    ```

3.  **Analyze:**

      * The JMeter Summary Report will show high average response times and `5xx` errors.
      * The Sitespeed.io report will show a *catastrophic* Time to First Byte (TTFB) for the `/api/products` XHR request, leading to terrible LCP and FCP metrics. This proves the direct link between back-end health and user experience.

-----

## ⚠️ Troubleshooting

**"I can't connect from another laptop / my phone\!"**

This is almost certainly a **Firewall issue** on the host machine (the one running the servers).

  * **Solution:** You must create **Inbound Rules** in your firewall (Windows Defender, macOS Firewall) to **ALLOW** incoming TCP connections on ports:
      * `4000` (Bad API)
      * `4001` (Good API)
      * `8080` (Bad UI)
      * `8081` (Good UI)