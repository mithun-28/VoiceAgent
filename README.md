# Max — Realtime AI Voice Agent

> A production-oriented realtime AI voice assistant built with **LiveKit Agents, Node.js, MongoDB, LLM tool calling, long-term memory, and Vector RAG**.

Max is a realtime AI agent designed to demonstrate how modern AI systems can move beyond a simple chatbot into a **stateful, tool-using, memory-enabled voice agent**.

The project focuses primarily on the **AI engineering architecture behind an intelligent realtime agent**, while also exploring how the same architecture can evolve into a practical personal AI product.

---

## What is Max?

Max is a realtime AI assistant that can communicate with users through **voice and text**, maintain long-term memory, retrieve information using semantic Vector Search, and interact with external tools.

Instead of treating every conversation as an isolated request, Max maintains context across sessions using MongoDB.

The goal is to build an architecture closer to a real AI agent:

```text
                    ┌─────────────────────┐
                    │       User          │
                    │   Voice / Text      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   LiveKit Agents    │
                    │  Realtime Runtime   │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┼─────────────┐
                 ▼             ▼             ▼
              STT Layer     Agent/LLM     TTS Layer
                 │             │             │
                 │             ▼             │
                 │       Tool Calling        │
                 │        ┌────┴────┐        │
                 │        ▼         ▼        │
                 │    Memory      RAG        │
                 │        │         │        │
                 │        └────┬────┘        │
                 │             ▼             │
                 │          MongoDB          │
                 │             │             │
                 └─────────────┴─────────────┘
                               │
                               ▼
                            User
```

---

# Core AI Engineering

The main purpose of this project is to explore the engineering required to build a **stateful realtime AI agent**.

### Key components

- Realtime voice AI
- Speech-to-Text
- Large Language Models
- Text-to-Speech
- Function/tool calling
- Long-term memory
- Vector Search
- Retrieval-Augmented Generation
- Session management
- User identity
- Interruption handling
- Turn detection
- Noise cancellation
- MongoDB persistence
- Modular model providers

---

# Realtime AI Architecture

Max is built using **LiveKit Agents** as the realtime agent runtime.

The basic interaction pipeline is:

```text
User speaks
     │
     ▼
Speech-to-Text
     │
     ▼
LLM / Agent
     │
     ├── Normal response
     │
     ├── Memory tool
     │
     ├── RAG tool
     │
     └── Other tools
     │
     ▼
Text-to-Speech
     │
     ▼
User hears response
```

The agent can also receive text directly:

```text
User Text
    │
    ▼
LiveKit
    │
    ▼
Agent
    │
    ├── Memory
    ├── RAG
    └── LLM
    │
    ▼
Response
```

This allows the same agent architecture to support both **voice-first and text-based interaction**.

---

# Voice AI Pipeline

The project is designed to support different AI providers without tightly coupling the entire application to a single vendor.

### Production-oriented Sarvam pipeline

```text
STT  → Gemini / LiveKit Inference
LLM  → Gemini
TTS  → Gemini
```

The agent prompt intentionally keeps technical terminology in English.

Examples:

```text
FastAPI endpoint
Vector database
MongoDB collection
Python code
API request
embedding
retrieval
```

This makes the conversation feel more natural for developers who communicate using **Tamil + English technical terminology**.

---

# Long-Term Memory

One of the main AI engineering features is persistent memory.

Traditional chatbots generally operate like:

```text
Conversation
     ↓
Response
     ↓
Conversation ends
```

Max instead uses:

```text
Conversation
     ↓
Agent decides whether information is useful
     ↓
Memory Tool
     ↓
MongoDB
     ↓
Future Sessions
```

For example:

```text
User:
"Remember that my preferred programming language is TypeScript."

        ↓

remember_detail()

        ↓

MongoDB

        ↓

Future conversation

User:
"What programming language do I prefer?"

        ↓

recall_details()

        ↓

TypeScript
```

The important design principle is that **the LLM decides when memory tools should be used**, rather than blindly storing every conversation message.

---

# MongoDB Memory Architecture

MongoDB is used as the persistence layer.

The current architecture separates different types of application data:

```text
MongoDB
│
├── users
│
├── sessions
│
├── memories
│
└── knowledge_vectors
```

### `users`

Stores application-level user information.

### `sessions`

Represents individual conversations.

### `memories`

Stores persistent user-specific information.

Example:

```json
{
  "user_id": "user-1",
  "tenant_id": "default",
  "memory_type": "preference",
  "content": "User prefers TypeScript",
  "created_at": "...",
  "updated_at": "..."
}
```

### `knowledge_vectors`

Stores documents together with their embeddings for semantic retrieval.

---

# Vector RAG

Max also includes a **Retrieval-Augmented Generation architecture**.

The goal is to allow the LLM to answer questions using information stored in the application's knowledge base.

The pipeline is:

```text
User Question
      │
      ▼
Generate Query Embedding
      │
      ▼
MongoDB Vector Search
      │
      ▼
Top-K Relevant Documents
      │
      ▼
LLM Context
      │
      ▼
Generated Answer
```

Instead of relying entirely on the LLM's internal knowledge:

```text
Question → LLM → Answer
```

the system can use:

```text
Question
   ↓
Retrieval
   ↓
Relevant Context
   ↓
LLM
   ↓
Grounded Answer
```

This is the same fundamental pattern used in many production AI applications.

---

# Agent Tools

Max uses LLM tool/function calling to connect the reasoning layer with application capabilities.

Current memory tools include:

### `remember_detail`

Stores useful information about the user.

### `recall_details`

Retrieves previously stored memories.

### `forget_detail`

Removes a specific memory when requested.

The RAG layer follows the same architecture:

```text
LLM
 │
 ├── remember_detail()
 │
 ├── recall_details()
 │
 ├── forget_detail()
 │
 └── search_knowledge()
```

This creates a clear separation between:

```text
Reasoning
   ↓
Tool Selection
   ↓
Application Logic
   ↓
Database
```

---

# Session Architecture

A session represents one conversation.

The architecture separates:

```text
User
  │
  ├── Session 1
  │      ├── Message
  │      ├── Message
  │      └── Message
  │
  ├── Session 2
  │      ├── Message
  │      └── Message
  │
  └── Persistent Memories
```

Sessions are temporary conversational state.

Memories are long-term user state.

This distinction becomes important when scaling the system.

---

# User Identity

Max does not treat every connection as a completely new user.

The intended production architecture is:

```text
Application Authentication
          │
          ▼
Authenticated User ID
          │
          ▼
LiveKit Identity
          │
          ▼
Agent
          │
          ▼
MongoDB user_id
```

For example:

```text
Authenticated user
      ↓
user-12345
      ↓
LiveKit identity
      ↓
MongoDB user_id
```

This allows memories and sessions to remain associated with the correct user across multiple conversations.

---

# Designed for Scale

The architecture is designed so that the application layer does not need a separate database for every user.

Instead:

```text
100,000 Users
      │
      ▼
Shared Application
      │
      ▼
MongoDB
      │
      ├── users
      ├── sessions
      ├── memories
      └── knowledge_vectors
```

Data isolation is achieved through identifiers such as:

```text
user_id
session_id
tenant_id
```

This makes the architecture suitable for evolving from a personal assistant into a multi-user AI application.

---

# Realtime Interaction

Voice interaction requires more than simply connecting STT and TTS.

Max also handles realtime conversation behaviour including:

- Turn detection
- User interruptions
- Preemptive generation
- Noise cancellation
- Realtime audio
- Text input
- Voice output

Conceptually:

```text
User speaking
      │
      ▼
Turn Detection
      │
      ▼
Agent begins processing
      │
      ├── User continues speaking
      │
      └── User interrupts
               │
               ▼
          Agent stops
               │
               ▼
          New request
```

This makes the interaction behave more like a realtime assistant rather than a request/response chatbot.

---

# Technology Stack

| Layer           | Technology             |
| --------------- | ---------------------- |
| Runtime         | Node.js                |
| Language        | TypeScript             |
| Realtime        | LiveKit Agents         |
| Voice Transport | LiveKit                |
| STT             | Gemini / Sarvam        |
| LLM             | Gemini / Sarvam        |
| TTS             | Gemini / Sarvam        |
| Database        | MongoDB                |
| Vector Search   | MongoDB Vector Search  |
| Memory          | MongoDB                |
| RAG             | Vector Retrieval + LLM |
| Environment     | `.env.local`           |
| Development     | pnpm                   |
| Testing UI      | Custom local HTML/JS   |

---

# Project Structure

```text
VoiceAgent/
│
├── src/
│   │
│   ├── main.ts
│   ├── agent.ts
│   │
│   ├── db/
│   │   ├── client.ts
│   │   ├── setup.ts
│   │   ├── test.ts
│   │   └── sessions.ts
│   │
│   ├── memory/
│   │   ├── memory.ts
│   │   └── tools.ts
│   │
│   └── rag/
│       ├── embeddings.ts
│       ├── ingest.ts
│       └── search.ts
│
├── test-server/
│   ├── server.ts
│   └── test-ui/
│       └── index.html
│
├── .env.local
├── package.json
├── tsconfig.json
└── README.md
```

---

# Installation

Clone the repository:

```bash
git clone <your-repository-url>
cd VoiceAgent
```

Install dependencies:

```bash
pnpm install
```

---

# Environment Variables

Create:

```text
.env.local
```

Example:

```env
LIVEKIT_URL=your_livekit_url
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

GOOGLE_API_KEY=your_google_api_key

sarvam_api_key=your_sarvam_api_key

MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=max_agent
```

Never commit `.env.local`.

Add it to `.gitignore`:

```text
.env
.env.local
```

---

# MongoDB Setup

Run:

```bash
pnpm exec tsx src/db/test.ts
```

Expected result:

```text
MongoDB connected: max_agent
Database: max_agent
MongoDB connection test successful
```

Then initialize the database:

```bash
pnpm exec tsx src/db/setup.ts
```

---

# Test Memory

Run:

```bash
pnpm exec tsx src/db/memory-test.ts
```

The test verifies that Max can:

```text
Insert memory
      ↓
MongoDB
      ↓
Retrieve memory
```

You can inspect the stored documents through MongoDB Compass or the MongoDB interface.

---

# Vector Search Setup

Create a Vector Search index for:

```text
knowledge_vectors
```

Example index configuration:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 384,
      "similarity": "cosine"
    }
  ]
}
```

The retrieval pipeline then becomes:

```text
Question
   ↓
Embedding
   ↓
MongoDB Vector Search
   ↓
Top-K documents
   ↓
LLM
   ↓
Answer
```

---

# Running Max

Start the agent:

```bash
pnpm dev
```

Start the local testing server:

```bash
pnpm exec tsx test-server/server.ts
```

Open the local test page:

```text
http://localhost:3000
```

The testing page can be used to verify:

- LiveKit connection
- Voice interaction
- Text interaction
- Agent responses
- Memory
- MongoDB persistence
- RAG retrieval

---

# Example AI Agent Tests

### Basic conversation

```text
User:
Hello Max

Max:
Hey! I'm Max. How can I help you?
```

### Memory

```text
User:
Remember that I prefer TypeScript.

Max:
Sure, I'll remember that.
```

Later:

```text
User:
What programming language do I prefer?

Max:
You prefer TypeScript.
```

### RAG

```text
User:
What is RAG?

Max:
RAG stands for Retrieval-Augmented Generation...
```

The answer can be grounded using the application's vector knowledge base.

---

# Engineering Principles

The project follows several principles important for production AI systems.

### 1. Modular model providers

STT, LLM, and TTS providers should be replaceable without rewriting the agent.

```text
Agent
 │
 ├── STT Provider
 ├── LLM Provider
 └── TTS Provider
```

### 2. Persistent state

Important user information is stored outside the LLM.

```text
LLM ≠ Database
```

The LLM decides what information should be stored, while MongoDB provides persistence.

### 3. Retrieval over hallucination

When application knowledge is available:

```text
Retrieve → Ground → Generate
```

Rather than relying exclusively on model knowledge.

### 4. User-level isolation

Every persistent record should be associated with a user and, where appropriate, a session.

### 5. Realtime-first architecture

Voice interaction is treated as a realtime system rather than a normal HTTP chatbot.

---

# Product Direction

While Max is primarily an AI engineering project, the architecture also demonstrates the foundation for a real AI assistant product.

Potential capabilities include:

- Personal knowledge memory
- Developer assistance
- Voice-based productivity
- Personal RAG knowledge base
- Task automation
- Document-based question answering
- Multilingual conversations
- Context-aware assistance

The long-term product concept is:

> **An AI assistant that doesn't just answer questions, but remembers, retrieves, understands context, and interacts with users in realtime.**

---

# Future Roadmap

## Phase 1 — Core Agent

- [x] LiveKit real-time agent
- [x] Voice interaction
- [x] Text interaction
- [x] MongoDB connection
- [x] Long-term memory

## Phase 2 — RAG

- [x] Knowledge collection
- [ ] Embedding generation
- [ ] Vector Search index
- [ ] Semantic retrieval
- [ ] RAG tool
- [ ] Grounded responses

## Phase 3 — Production Architecture

- [ ] Authentication
- [ ] Stable user identities
- [ ] Session management
- [ ] Conversation history
- [ ] Better memory ranking
- [ ] Multi-tenant isolation
- [ ] Observability
- [ ] Error handling
- [ ] Rate limiting

## Phase 4 — Product

- [ ] Web application
- [ ] User accounts
- [ ] Personal knowledge bases
- [ ] Custom memories
- [ ] Document ingestion
- [ ] Voice-first workflows
- [ ] Task automation
- [ ] Mobile experience

---

# Why This Project?

Max is intentionally built as more than a simple:

```text
Microphone → LLM → Speaker
```

The project explores the engineering behind modern AI agents:

```text
Realtime Communication
        +
LLM Reasoning
        +
Tool Calling
        +
Long-Term Memory
        +
Vector Retrieval
        +
Persistent User State
        +
Multilingual Interaction
        =
AI Agent
```

This makes the project useful as a practical exploration of **AI agents, RAG systems, realtime AI infrastructure, LLM tool use, and production-oriented application architecture**.

---

# Author

**Mithun Lakshmipathy**

AI / ML Engineer | Data & AI Engineering

Interested in:

- AI Agents
- Generative AI
- RAG
- LLM Applications
- Voice AI
- Machine Learning
- Data Engineering
- Analytics

---

# Project Vision

Max started as a realtime voice assistant experiment.

The larger goal is to explore how AI systems can evolve from:

```text
Question → Answer
```

into:

```text
User
 ↓
Realtime Agent
 ↓
Understand
 ↓
Reason
 ↓
Retrieve
 ↓
Use Tools
 ↓
Remember
 ↓
Respond
 ↓
Learn from future interactions
```

**The focus is not just building a chatbot — it is understanding and engineering the systems that make AI agents useful.**
