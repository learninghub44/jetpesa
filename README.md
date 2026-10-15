<div align="center">

  <img src="https://img.shields.io/badge/JETPESA-FLIGHT%20ENGINE-00ff88?style=for-the-badge&logo=rocket&logoColor=black" alt="JetPesa Banner" />

  # ✈️ JetPesa

  <p><strong>A lightning-fast, modern Aviator-style crash betting and multiplayer gaming platform built with Next.js, Firebase, PayHero, and Safaricom Daraja STK Push.</strong></p>

  <p>
    <a href="https://github.com/tookarius/jetpesa/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js_14-black?style=flat&logo=next.js&logoColor=white" alt="Next.js"></a>
    <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black" alt="Firebase"></a>
    <a href="https://www.safaricom.co.ke/"><img src="https://img.shields.io/badge/M--Pesa-00A65A?style=flat&logo=safaricom&logoColor=white" alt="M-Pesa"></a>
  </p>

  <!-- QUICK DEPLOY BUTTONS -->
  <h3>🚀 One-Click Deployments</h3>
  <p>
    <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftookarius%2Fjetpesa"><img src="https://vercel.com/button" alt="Deploy with Vercel" height="32"></a>
    &nbsp;&nbsp;
    <a href="https://render.com/deploy?repo=https://github.com/tookarius/jetpesa"><img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" height="32"></a>
    &nbsp;&nbsp;
    <a href="https://app.koyeb.com/deploy?type=git&repository=https://github.com/tookarius/jetpesa"><img src="https://www.koyeb.com/static/images/deploy/button.svg" alt="Deploy to Koyeb" height="32"></a>
    &nbsp;&nbsp;
    <a href="https://replit.com/github/tookarius/jetpesa"><img src="https://raw.githubusercontent.com/replit/support/main/assets/images/deploy-to-replit-button.svg" alt="Deploy to Replit" height="32"></a>
  </p>

</div>

---

## ✨ Key Features

| Category | Highlights |
| :--- | :--- |
| 🎮 **Gameplay** | Real-time multiplier crash engine, auto-flight rendering, animated aircraft SVG, rain effects, sound effects, and provably fair mechanics. |
| 💸 **Payments** | M-Pesa STK Push integration via PayHero (Primary) with Safaricom Daraja API fallback. Secure backend callback wallet verification. |
| 🎛️ **Betting Engine** | Dual betting decks, configurable Auto Bet, Auto Cashout triggers, and manual cashout systems. |
| 👥 **Social & Multi-User** | Live multiplayer lobby chat, live activity feed, and live wager tapes. |
| 📱 **UI/UX** | Mobile-responsive cockpit layout optimized for seamless touch and desktop play. |

---

## 🛠️ Tech Stack

* **Framework:** [Next.js 14](https://nextjs.org/) (React)
* **Backend & Database:** Firebase Authentication, Cloud Firestore, Firebase Admin SDK
* **Payments:** Safaricom Daraja API, PayHero API
* **Graphics & Animations:** HTML5 Canvas API, `canvas-confetti`, Tailwind CSS

---

## 🚀 Quick Start & Installation

### 1. Clone the Repository
```bash
git clone [https://github.com/tookarius/jetpesa.git](https://github.com/tookarius/jetpesa.git)
cd jetpesa
2. Install Dependencies
Bash
npm install
3. Configure Environment Variables
Create a .env.local file in the root directory and populate your keys (see the Environment Variables section below):

Bash
cp .env.example .env.local
4. Run Locally
Bash
npm run dev
Open http://localhost:3000 in your browser to experience the cockpit.

🔑 Environment Variables
Create a .env.local file in your project root with the following variables:

Code snippet
# --- Firebase Client Config ---
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# --- Firebase Admin SDK ---
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# --- PayHero Payment Gateway ---
PAYHERO_API_USERNAME=
PAYHERO_API_PASSWORD=
PAYHERO_CHANNEL_ID=

# --- Safaricom Daraja API ---
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_STORE_NUMBER=
MPESA_TILL_NUMBER=
MPESA_PASSKEY=
🔥 Firebase Setup Guide
JavaScript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /deposits/{depositId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
💳 Payment Gateway Architecture
JetPesa implements a bulletproof transaction verification loop:

Primary Gateway: PayHero STK Push handles initial prompt routing.

Fallback Gateway: Safaricom Daraja API handles automatic failovers if PayHero experiences downtime.

Secure Callbacks: Wallet balances are only credited after asynchronous server-to-server callback confirmation. Frontend responses never trigger balance updates directly, eliminating fake deposits.

☁️ Deployment Guides
🌐 Deploying to Vercel (Recommended)
Push your repository to GitHub.

Click the Deploy with Vercel button at the top of this readme or import the project on Vercel Dashboard.

Add all your environment variables under the Environment Variables section during configuration.

Hit Deploy.

🐳 Deploying to a Custom VPS (Ubuntu / Debian)
To run JetPesa on a Virtual Private Server via PM2 and Nginx:

Bash
# Update system & install Node.js 18+
curl -fsSL [https://deb.nodesource.com/setup_18.x](https://deb.nodesource.com/setup_18.x) | sudo -E bash -
sudo apt-get install -y nodejs build-essential

# Clone repository & build
git clone [https://github.com/tookarius/jetpesa.git](https://github.com/tookarius/jetpesa.git)
cd jetpesa
npm install
npm run build

# Install PM2 for process management
sudo npm install -g pm2
pm2 start npm --name "jetpesa" -- start
pm2 startup
pm2 save
⚠️ Production Security Notes
🔒 Never credit wallets directly from client-side frontend responses.

🛡️ Always validate payment amounts server-side using webhook secure hashes.

🔐 Keep your Firebase Admin Private Keys and M-Pesa secrets strictly confidential.

📜 Enforce strict Firestore security rules before opening the platform to real users.

📝 License
Distributed under the MIT License.
