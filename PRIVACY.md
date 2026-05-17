# 🔒 Privacy Policy

**Last updated: May 2026**

AgriForce is committed to protecting the privacy of its users. This document outlines what data AgriForce collects, how it is used, and the rights users have over their data.

---

## 1. Overview

AgriForce is a free, open-source vertical farming management platform. We are committed to a **privacy-by-default** approach — collecting only the minimum data necessary to provide our service, and never selling or sharing user data with third parties for commercial purposes.

---

## 2. What Data We Collect

### 2.1 Farm Data (Non-PII)
AgriForce users voluntarily enter the following anonymous farm data:
- Crop names and positions within the farm layout
- Environmental readings (temperature, humidity, CO2, light intensity, irrigation schedules)
- Plant journal entries (growth observations, health notes)
- Farm layout configurations (tower structures, lighting modules)

This data is **not personally identifiable** and cannot be used to identify an individual.

### 2.2 Crop Images (Optional)
Users may optionally upload photographs of their crops for AI-powered health and disease analysis. These images are:
- Sent directly to Groq's API for real-time processing
- **Not stored permanently** on AgriForce servers
- **Not used** for training or any other purpose beyond the immediate analysis requested

### 2.3 Data We Do NOT Collect
AgriForce does **not** collect:
- ❌ Names or personal identifiers
- ❌ Email addresses (in the RAG backend)
- ❌ Location data
- ❌ Payment information
- ❌ Browsing history or analytics
- ❌ Device identifiers
- ❌ Any biometric data

---

## 3. How We Use Data

Farm data entered by users is used solely for the following purposes:
- Providing personalized AI recommendations based on the user's specific farm
- Enabling the AI assistant to answer farm-specific questions accurately
- Improving the quality and relevance of AI responses within a session

We do **not** use farm data for:
- ❌ Advertising or marketing
- ❌ Selling to third parties
- ❌ Training AI models without explicit consent
- ❌ Any purpose beyond providing the AgriForce service

---

## 4. Data Storage & Security

- Farm data entered by users is stored within the Base44 platform infrastructure
- The AgriForce RAG backend (FastAPI + FAISS) does not maintain a persistent user database
- All communications between the user's browser and AgriForce servers are encrypted via **HTTPS**
- API keys and credentials are stored as environment variables and never exposed in source code
- The AgriForce codebase is open source — anyone can audit our data practices at any time

---

## 5. Third Party Services

AgriForce integrates with the following third-party services:

| Service | Purpose | Privacy Policy |
|---|---|---|
| **Groq API** | AI language model inference and image analysis | [groq.com/privacy-policy](https://groq.com/privacy-policy) |
| **Hugging Face** | Hosting the AgriForce RAG backend | [huggingface.co/privacy](https://huggingface.co/privacy) |
| **Base44** | Frontend application platform | [base44.com](https://base44.com) |

Users should review the privacy policies of these third-party services as their terms apply to data processed through their platforms.

---

## 6. Data Retention

- **Crop images** — Not retained. Processed in real-time and immediately discarded after analysis
- **Chat history** — Stored temporarily in session memory only. Cleared when the session ends
- **Farm data** — Retained within the user's Base44 account until the user deletes it

---

## 7. User Rights

Users of AgriForce have the right to:
- **Access** — View all farm data they have entered at any time
- **Export** — Export their farm data in JSON or CSV format via the AgriForce API
- **Delete** — Delete their farm data at any time through the Base44 platform
- **Portability** — All data is stored in open, non-proprietary formats (JSON/CSV)

---

## 8. Children's Privacy

AgriForce is an agricultural management tool with no social features, direct user-to-user communication, or personal data collection. The platform is inherently safe for users of all ages. We do not knowingly collect any personal data from children under the age of 13.

---

## 9. Open Source Transparency

AgriForce is fully open source under the MIT License. All code, including data handling logic, is publicly available for review at:

👉 **https://github.com/pavitthakkar/AgriForce-App**

This means anyone can audit exactly how AgriForce handles data at any time — providing a level of transparency that goes beyond a typical privacy policy.

---

## 10. Changes to This Policy

We may update this Privacy Policy from time to time. Any changes will be reflected in the "Last updated" date at the top of this document and committed to the public GitHub repository, ensuring full transparency.

---

## 11. Contact

If you have any questions or concerns about this Privacy Policy, please open an issue on our GitHub repository:

👉 **https://github.com/pavitthakkar/AgriForce-App/issues**

---

*AgriForce — Built by Pavit Thakkar and Yash Gupta with 🌱 for a more sustainable food future*
