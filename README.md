# ✈️ JetPesa

### The next-generation Aviator-style gaming platform

**JetPesa** is a modern, mobile-responsive Aviator-style gaming platform built with Next.js, Firebase, PayHero, and Safaricom Daraja. It combines an immersive flight cockpit, real-time gameplay, automated betting controls, and M-Pesa wallet integration in a streamlined interface.

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftookarius%2Fjetpesa">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" />
  </a>
  <a href="https://render.com/">
    <img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" />
  </a>
  <a href="https://www.koyeb.com/">
    <img src="https://www.koyeb.com/static/images/deploy/button.svg" alt="Deploy to Koyeb" />
  </a>
</p>

<p align="center">
  <a href="https://replit.com/import">
    <img src="https://replit.com/badge/github/tookarius/jetpesa" alt="Run on Replit" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/tookarius/jetpesa">
    <img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github" alt="GitHub Repository" />
  </a>
  <a href="https://github.com/tookarius/jetpesa/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" />
  </a>
</p>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Firebase Configuration](#-firebase-configuration)
- [Payment Integration](#-payment-integration)
- [Deployment](#-deployment)
- [Production Checklist](#-production-checklist)
- [Security](#-security)
- [License](#-license)
- [Author](#-author)

---

## 🚀 Overview

JetPesa brings together interactive Aviator-style gameplay and mobile money integration in a single web application.

The platform is designed around a responsive cockpit interface, animated flight sequences, real-time wallet updates, and convenient betting controls.

### What makes JetPesa different?

- **Immersive gameplay:** Animated aircraft, multiplier progression, flight effects, and sound.
- **Automated betting:** Configure Auto Bet and Auto Cashout for supported gameplay flows.
- **M-Pesa integration:** Support deposits through PayHero and Safaricom Daraja.
- **Firebase backend:** Authentication, Firestore data storage, and server-side administrative operations.
- **Multiplayer experience:** Live lobby chat, activity feeds, and wager displays.
- **Responsive design:** An interface optimized for mobile devices and desktop screens.

> **Important:** Gameplay fairness, real-time synchronization, payment reconciliation, and betting settlement must be validated against the actual implementation before the platform is used with real funds.

---

## ✨ Features

### 🎮 Aviator-Style Gameplay

- Real-time multiplier display.
- Animated aircraft and flight rendering.
- Crash-round simulation.
- Manual cashout controls.
- Auto Bet and Auto Cashout.
- Dual betting decks.
- Optional rain effects, sound, and animations.
- Confetti and visual feedback.

### 💳 Wallet & Payments

- M-Pesa STK Push deposits.
- PayHero payment gateway integration.
- Safaricom Daraja API integration.
- Deposit callback processing.
- Withdrawal request workflow.
- Firestore-backed wallet data.
- Real-time balance updates where supported.

### 🔥 Firebase Integration

- Firebase Authentication.
- Email/password authentication.
- Phone authentication, when configured.
- Cloud Firestore database.
- Firebase Admin SDK for trusted server operations.
- User-specific data access controls.

### 💬 Multiplayer & Social

- Live lobby chat.
- Multiplayer activity feed.
- Live wager tape.
- Shared gameplay interface.

### 📱 User Experience

- Mobile-responsive cockpit UI.
- Animated SVG aircraft.
- Canvas-based visual effects.
- Optional rain and sound modes.
- Smooth gameplay animations.

---

## 🧰 Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 14 | React framework and application routing |
| React | User interface |
| Firebase Authentication | User authentication |
| Cloud Firestore | Application data and wallet records |
| Firebase Admin SDK | Trusted server-side Firebase operations |
| PayHero API | Payment gateway integration |
| Safaricom Daraja API | M-Pesa integration |
| Canvas API | Graphics and visual effects |
| canvas-confetti | Celebration effects |
| Vercel | Recommended deployment option |

---

## ⚡ Getting Started

### Prerequisites

Install the following before running JetPesa locally:

- Node.js compatible with your project's Next.js version.
- npm.
- Git.
- A Firebase project.
- PayHero credentials if enabling payment integration.
- Safaricom Daraja credentials if enabling direct M-Pesa integration.

### 1. Clone the repository

```bash
git clone https://github.com/tookarius/jetpesa.git
cd jetpesa
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root and populate it with the configuration described in [Environment Configuration](#-environment-configuration).

### 4. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### 5. Build for production

```bash
npm run build
npm run start
```

If the project defines additional scripts, consult `package.json` for the supported commands.

---

## 🔐 Environment Configuration

Create `.env.local` in the root directory.

```env
# ==========================================
# FIREBASE CLIENT CONFIGURATION
# ==========================================

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# ==========================================
# FIREBASE ADMIN SDK
# ==========================================

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# ==========================================
# PAYHERO PAYMENT GATEWAY
# ==========================================

PAYHERO_API_USERNAME=
PAYHERO_API_PASSWORD=
PAYHERO_CHANNEL_ID=

# ==========================================
# SAFARICOM DARAJA / M-PESA
# ==========================================

MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_STORE_NUMBER=
MPESA_TILL_NUMBER=
MPESA_PASSKEY=
```

### Configuration notes

- Obtain Firebase client values from your Firebase project settings.
- Generate a Firebase service-account key for trusted server-side operations.
- Obtain PayHero credentials and the channel ID from your PayHero account.
- Obtain Daraja credentials and the appropriate M-Pesa configuration from Safaricom's developer portal.
- Populate only the variables required by the payment flows you have implemented.
- Confirm the expected environment variable names in the source code before deploying.

**Never commit `.env.local`, Firebase service-account keys, payment credentials, or private keys to Git.**

For Firebase private keys, preserve newline formatting when required by your server-side initialization code. A common approach is to store escaped newlines and convert them to actual newlines in the server configuration.

---

## 🔥 Firebase Configuration

### 1. Create a Firebase project

Open the [Firebase Console](https://console.firebase.google.com/) and create or select a project.

Register a web application and copy its configuration values into the appropriate `NEXT_PUBLIC_FIREBASE_*` variables.

### 2. Enable Authentication

In **Firebase Console → Authentication → Sign-in method**, enable the providers required by your application:

- Email/Password.
- Phone, if supported and required.

Configure authorized domains for local development and your production deployment.

### 3. Create a Cloud Firestore database

Open **Firestore Database** and create a database.

Use production mode and deploy security rules that match the application's actual data model.

### 4. Example Firestore security rules

The following is a restrictive starting point for user-owned documents. Adapt it to the fields and collections your application actually uses.

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read: if request.auth != null
                  && request.auth.uid == userId;

      // Replace with validated, server-controlled updates
      // for sensitive profile and wallet fields.
      allow write: if false;
    }

    match /deposits/{depositId} {
      allow read: if request.auth != null
                  && resource.data.userId == request.auth.uid;

      // Deposits must be created and updated by trusted
      // server-side payment processing.
      allow write: if false;
    }
  }
}
```

**Important:** These example rules intentionally prevent client-side writes to user documents and deposits. If the frontend currently writes profile fields directly, implement narrowly scoped field validation or move those writes to trusted server-side handlers before enabling these rules.

Never grant users unrestricted write access to wallet balances, payment status, bet settlement records, or administrative fields.

### 5. Configure Firebase Admin SDK

Navigate to:

**Firebase Console → Project Settings → Service Accounts**

Generate a service-account key and configure the corresponding server-only environment variables:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Initialize Firebase Admin only in trusted server-side code.

Do not expose service-account credentials through client components, API responses, public environment variables, or source control.

---

## 💸 Payment Integration

JetPesa supports integration with PayHero and Safaricom Daraja for M-Pesa payment processing.

### Payment flow

1. A user initiates a deposit.
2. The server validates the amount and user identity.
3. The configured payment provider initiates the STK Push request.
4. The payment provider processes the transaction.
5. A verified callback reports the payment outcome.
6. The backend validates the callback and reconciles the transaction.
7. The wallet is credited only after confirmed, verified payment success.

### Payment security requirements

- Never trust payment status returned solely by the browser.
- Verify callback authenticity using the provider's supported verification mechanisms.
- Match transaction references, amounts, and user records.
- Process callbacks idempotently to prevent duplicate credits.
- Store transaction identifiers and processing status.
- Reject duplicate, malformed, or inconsistent payment events.
- Keep provider credentials on the server.
- Log transaction outcomes without exposing sensitive credentials or personal data.

### PayHero and Daraja fallback

If PayHero is the primary gateway and Daraja is the fallback, implement explicit error handling and transaction reconciliation.

A timeout does not necessarily mean a payment failed. Before retrying through another provider, check the original transaction's status to avoid duplicate STK requests or duplicate wallet credits.

---

## ☁️ Deployment

Choose a hosting provider below. Before deploying, make sure your repository builds successfully and all required environment variables are configured.

### 🚀 Deploy with Vercel

**Recommended starting point for a standard Next.js deployment.**

<AsyncImage query="Vercel platform logo black white" aspectRatio="16:9" width="100%" maxHeight={100} fit="contain"/>

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftookarius%2Fjetpesa)

1. Click the deploy button.
2. Import the JetPesa repository.
3. Configure the required environment variables.
4. Deploy the application.
5. Verify authentication, server routes, callbacks, and production behavior.

- [Open Vercel deployment](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftookarius%2Fjetpesa)
- [Vercel documentation for Next.js](https://vercel.com/docs/frameworks/nextjs)

### 🎨 Deploy with Render

<AsyncImage query="Render cloud hosting platform logo" aspectRatio="16:9" width="100%" maxHeight={100} fit="contain"/>

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/)

1. Create a new Web Service.
2. Connect `https://github.com/tookarius/jetpesa`.
3. Select the appropriate Node.js runtime.
4. Configure the build command:

   ```bash
   npm install && npm run build
   ```

5. Configure the start command:

   ```bash
   npm run start
   ```

6. Add environment variables and deploy.

- [Open Render](https://render.com/)
- [Render documentation](https://render.com/docs)

**Note:** Verify the service's Next.js deployment requirements and port configuration. Do not assume a static-site deployment supports the application's server-side routes or payment callbacks.

### 🛠️ Deploy with Koyeb

<AsyncImage query="Koyeb cloud deployment platform logo" aspectRatio="16:9" width="100%" maxHeight={100} fit="contain"/>

[![Deploy to Koyeb](https://www.koyeb.com/static/images/deploy/button.svg)](https://www.koyeb.com/)

1. Create a Koyeb account.
2. Create an application and connect the GitHub repository.
3. Configure the build and run settings for Next.js.
4. Add your environment variables.
5. Deploy and verify the production URL.

- [Open Koyeb](https://www.koyeb.com/)
- [Koyeb documentation](https://www.koyeb.com/docs)

### 💻 Run on Replit

<AsyncImage query="Replit online coding platform logo" aspectRatio="16:9" width="100%" maxHeight={100} fit="contain"/>

[![Run on Replit](https://replit.com/badge/github/tookarius/jetpesa)](https://replit.com/import)

1. Open the Replit import page.
2. Import the JetPesa GitHub repository.
3. Configure the environment variables using Replit Secrets.
4. Install dependencies and run the application.
5. Verify that the app and required server routes are working.

- [Import on Replit](https://replit.com/import)
- [Replit documentation](https://docs.replit.com/)

### 🖥️ Deploy to a VPS

A VPS provides greater control over the runtime, reverse proxy, networking, and process management.

Suitable providers include:

- [Hetzner Cloud](https://www.hetzner.com/cloud/)
- [DigitalOcean](https://www.digitalocean.com/)
- [Linode / Akamai Cloud](https://www.linode.com/)
- [AWS Lightsail](https://aws.amazon.com/lightsail/)

#### Example VPS setup

On a supported Ubuntu server:

```bash
# Install Git and Node.js using your preferred
# supported installation method.

git clone https://github.com/tookarius/jetpesa.git
cd jetpesa

npm install
```

Create `.env.local` with the production configuration, then run:

```bash
npm run build
npm run start
```

For persistent production hosting, use a process manager such as PM2:

```bash
npm install -g pm2
pm2 start npm --name jetpesa -- start
pm2 save
pm2 startup
```

Configure the command printed by `pm2 startup` as instructed by PM2.

Before going live:

- Configure a domain name and DNS records.
- Set up HTTPS using Nginx and an appropriate TLS certificate.
- Restrict inbound ports with a firewall.
- Keep Node.js and operating-system packages updated.
- Configure process restart and log monitoring.
- Back up important data and verify payment callback reachability.

A VPS does not replace Firebase or automatically configure your payment gateway. Those services must still be configured separately.

---

## 🛡️ Production Checklist

Before exposing JetPesa to real users, verify the following:

- [ ] All required environment variables are configured.
- [ ] Production Firebase Authentication works.
- [ ] Firestore security rules have been reviewed.
- [ ] Wallet changes are authorized by trusted backend logic.
- [ ] Payment callbacks are verified and idempotent.
- [ ] Deposit amounts and transaction references are validated.
- [ ] Payment timeouts and duplicate callbacks are handled.
- [ ] Bet settlement and cashout logic run on a trusted server.
- [ ] The crash/multiplier engine cannot be manipulated by the client.
- [ ] Rate limiting and abuse protection are enabled.
- [ ] HTTPS is enabled for the production domain.
- [ ] Logs and error monitoring are configured.
- [ ] Database backups and recovery procedures are tested.
- [ ] Applicable licensing, consumer-protection, age-verification, and gambling regulations have been reviewed.

---

## 🔒 Security

JetPesa handles authentication and payment-related operations, so security must be enforced at the backend rather than relying on frontend restrictions.

**Never:**

- Commit credentials or private keys.
- Trust client-submitted wallet balances.
- Credit deposits before verified payment confirmation.
- Trust client-side cashout or bet settlement calculations.
- Allow users to update administrative fields.
- Treat a provider timeout as definitive payment failure.
- Assume a deployment button automatically configures production services.

Use least-privilege access controls, server-side validation, transaction-level safeguards, and comprehensive audit logging.

---

## 📄 License

This project is distributed under the MIT License, subject to the terms in the repository's [`LICENSE`](https://github.com/tookarius/jetpesa/blob/main/LICENSE) file.

---

## 👨‍💻 Author

**TK**

- GitHub: [@tookarius](https://github.com/tookarius)
- Repository: [tookarius/jetpesa](https://github.com/tookarius/jetpesa)

---

<p align="center">
  <strong>JetPesa — Built for a modern, responsive gaming experience.</strong>
</p>

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftookarius%2Fjetpesa">Deploy with Vercel</a>
  ·
  <a href="https://render.com/">Deploy with Render</a>
  ·
  <a href="https://www.koyeb.com/">Deploy with Koyeb</a>
  ·
  <a href="https://replit.com/import">Run on Replit</a>
</p>
