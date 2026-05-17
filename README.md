# 🌱 AgriForce — AI-Powered Vertical Farming Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![AI: Groq + Llama 4 Scout](https://img.shields.io/badge/AI-Groq%20%2B%20Llama%204%20Scout-blue)](https://groq.com)
[![Vector DB: FAISS](https://img.shields.io/badge/Vector%20DB-FAISS-orange)](https://github.com/facebookresearch/faiss)
[![Deployed on: Hugging Face](https://img.shields.io/badge/Deployed%20on-Hugging%20Face-yellow)](https://huggingface.co/spaces/Pavsts/agriforce-rag-system)

AgriForce is a free, open-source vertical farming management platform that empowers farmers, students, researchers, and urban agriculture enthusiasts to design, monitor, and optimize their vertical farms using AI.

---

## 🌍 Why AgriForce?

Vertical farming is one of the most promising solutions to global food security challenges — producing more food using less water, no pesticides, and minimal land. However, managing a vertical farm is complex, requiring expertise in lighting, nutrients, plant health, and environmental controls.

AgriForce democratizes access to this expertise by combining:
- A **visual farm builder** anyone can use
- **Real-time environmental monitoring**
- An **AI assistant** trained on vertical farming knowledge that understands your specific farm

---

## ✨ Key Features

### 🏗️ Vertical Farm Canvas Builder
Design your farm layout visually. Add towers, assign crops to specific spots, configure lighting modules, and organize your growing zones — all in an intuitive drag-and-drop interface.

### 📓 Plant Journal
Log observations about your plants over time. Track growth stages, record health notes, and monitor progress from seed to harvest.

### 🌡️ Environmental Controls
Monitor and log your farm's environmental readings including:
- Temperature & humidity
- CO2 levels
- Light intensity and schedules
- Irrigation timing

### 🤖 AI Assistant (RAG-Powered)
The heart of AgriForce — an intelligent farming assistant that:
- Has **full context of your specific farm** (layout, crops, environment, plant logs)
- Answers questions about crop health, lighting, nutrients, and pest control
- **Analyzes crop images** to detect diseases and health issues
- Provides **farm-specific recommendations** based on your actual readings
- Is trained on vertical farming research, hydroponic data, and crop growing guides

---

## 🏛️ Architecture

```
AgriForce Web App (Base44)
        ↓
Hugging Face Space (24/7 API)
        ↓
FastAPI Backend
├── /chat          → RAG-powered Q&A with farm context
├── /analyze-image → Groq vision for crop image analysis
└── /sync-farm-data → Syncs Base44 farm data into FAISS
        ↓
FAISS Vector Database (113,000+ knowledge chunks)
        ↓
Groq API (Llama 4 Scout) — Text + Image Processing
```

---

## 🧠 AI & RAG System

AgriForce uses a **Retrieval-Augmented Generation (RAG)** architecture:

1. **Knowledge Base** — FAISS vector database trained on:
   - WUR Vertical Farming Cultivation Guidelines (2024)
   - OpenFarm crop growing guides (800+ crops)
   - Hydroponic IoT sensor datasets
   - Custom vertical farming knowledge (lighting, nutrients, diseases, spacing)
   - USDA plant data
   - Smart farming IoT data

2. **Embeddings** — `sentence-transformers/all-MiniLM-L6-v2` via LangChain HuggingFace

3. **LLM** — Llama 4 Scout (17B) via Groq API — chosen for speed, multimodal capability, and free tier availability

4. **Farm Context** — Every query includes the user's real farm data (canvas layout, plant journal, environmental readings) so responses are always specific to their farm

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Frontend/App** | Base44 (React) |
| **AI Framework** | LangChain |
| **LLM** | Llama 4 Scout via Groq API |
| **Vector Database** | FAISS (Facebook AI Similarity Search) |
| **Embeddings** | sentence-transformers/all-MiniLM-L6-v2 |
| **Backend API** | FastAPI + Uvicorn |
| **Deployment** | Hugging Face Spaces (Docker) |
| **License** | MIT |

---

## 🌐 Deployment

AgriForce's RAG backend is deployed on **Hugging Face Spaces** using Docker: https://huggingface.co/spaces/Pavsts/agriforce-rag-system

---

## 📊 Training Data Sources

| Dataset | Source | License |
|---|---|---|
| Vertical Farm Cultivation Guidelines | WUR (Wageningen University) | CC BY |
| OpenFarm Crop Data | OpenFarm API | CC BY-SA |
| Hydroponic IoT Data | Kaggle | Open |
| Smart Farming Data 2024 | Kaggle | Open |
| USDA Plant Data | USDA | Public Domain |
| Custom Knowledge Base | AgriForce Team | MIT |

---

## 🤝 Contributing

AgriForce is open source and welcomes contributions! Here's how you can help:

- 🌱 Add more crop knowledge to the training data
- 🐛 Report bugs or issues
- 💡 Suggest new features
- 📖 Improve documentation
- 🌍 Translate to other languages

Please read our contributing guidelines and submit pull requests to our GitHub repository.

---

## 🎯 Digital Public Good Alignment

AgriForce is designed to meet the [Digital Public Goods Standard](https://digitalpublicgoods.net/standard/):

- ✅ **Open Source** — MIT License, fully open codebase
- ✅ **Open Data** — Training data from open datasets
- ✅ **Relevance to SDGs** — Supports SDG 2 (Zero Hunger), SDG 11 (Sustainable Cities), SDG 12 (Responsible Consumption), SDG 13 (Climate Action)
- ✅ **Privacy** — No personal data collected beyond farm layout
- ✅ **Do No Harm** — Agricultural guidance only
- ✅ **Accessible** — Free to use, no payment required

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Wageningen University & Research](https://www.wur.nl) for vertical farming guidelines
- [OpenFarm](https://openfarm.cc) for crop growing data
- [Groq](https://groq.com) for fast LLM inference
- [Meta AI](https://ai.meta.com) for Llama 4 Scout
- [LangChain](https://langchain.com) for the RAG framework
- [Hugging Face](https://huggingface.co) for free model hosting

---

*Built by Pavit Thakkar and Yash Gupta with 🌱 for a more sustainable food future*
