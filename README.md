# Production-Ready PDF → Question Bank Extraction & Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![OCR Engine](https://img.shields.io/badge/OCR-Tesseract.js-orange)](https://github.com/naptha/tesseract.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A high-performance, production-ready platform designed to ingest educational PDFs, question papers, and exam materials, extract **ONLY** questions, options, and correct answers while ignoring all document noise (chapter headings, book titles, page numbers, explanations, copyright, author notices), and manage a clean, reusable question database with **Vector SVG generation**, **Standard CSV export/import**, and a comprehensive **Question Bank SaaS Dashboard**.

---

## 🚀 Key Architectural Capabilities

### 1. High-Fidelity Noise-Filtering Extraction (Zero Noise)
Intelligently parses question blocks while discarding:
- Book & Chapter Titles (`Chapter 1`, `অধ্যায় ৩`)
- Headers, Footers, Page numbers (`Page 12`, `পৃষ্ঠা ১২`, `[ 12 ]`, `- 12 -`)
- Explanations & Descriptions (`ব্যাখ্যা: ...`, `Explanation: ...`, `সমাধান: ...`)
- Copyright & Publisher Notices (`Copyright © 2026`, `All Rights Reserved`)
- Author Information (`Author: ...`, `লেখক: ...`)
- Exam Instructions (`Important Notice: Calculators not allowed...`)
- Decorative Dividers (`---`, `===`, `***`)

### 2. Native Multi-Language Support (English & Bengali)
- **Question Numbering**:
  - English: `1. `, `1) `, `(1) `, `Q1. `, `Question 1: `
  - Bengali: `১। `, `১. `, `১) `, `(১) `, `প্রশ্ন ১: `
- **Option Formats**:
  - English: `A.`, `B.`, `C.`, `D.`, `E.` / `(a)`, `(b)`, `(c)`, `(d)` / `A)`, `B)`, `C)`, `D)`
  - Bengali: `ক.`, `খ.`, `গ.`, `ঘ.`, `ঙ.` / `ক)`, `খ)`, `গ)`, `ঘ)`
  - Normalized internally into uppercase standard keys (`A`, `B`, `C`, `D`, `E`).
- **Multi-Line Questions**: Complete multi-sentence prompts are preserved as a single question block without breaking across lines.

### 3. Zero-Hallucination Answer Detection & Review Workflow
- **Inline Answers**: Scans patterns like `Answer: B`, `Ans: (b)`, `Correct Answer: C`, `উত্তর: খ`, `সঠিক উত্তর: ক`.
- **Standalone Answer Key Mapping**: Identifies answer keys at the bottom or end of the document (e.g. `1-B, 2-C, 3-A` or `১: খ, ২: গ`) and maps them to their corresponding question numbers.
- **Strict Anti-Hallucination Rule**: If an answer is not confidently detected in the text or key, it is marked as `null` with status `needs_review` / `missing_answer` — answers are **never** invented.

### 4. Vector SVG Generation Engine & Visual SVG Studio
- **Two-Column Vector SVG Layout**:
  - **Left Section**: Question badge, multi-line wrapped question statement, and styled option cards.
  - **Right Section**: Clear separation of detected answer with verification badges and optional explanation.
- **Customizable Styling**:
  - Themes: Light, Modern Dark, Midnight Navy, Sepia Classic, Minimalist Monochrome.
  - Typography: Custom fonts, font sizes, line heights, border radius, watermarks.
- **Single & Bulk Downloads**: Download individual questions as SVG, or bundle hundreds of questions into a ZIP archive with 1 click using `jszip`.

### 5. Standard CSV Export & Import Contract (Section 46 & 18)
- **Exact Section 46 Header Structure**:
  ```csv
  question,option_a,option_b,option_c,option_d,answer
  "বাংলাদেশের রাজধানী কোনটি?","চট্টগ্রাম","ঢাকা","রাজশাহী","খুলনা","B"
  ```
- **UTF-8 BOM (`\uFEFF`)**: Flawless Bengali script preservation in Microsoft Excel and Google Sheets without encoding corruptions.
- **Section 18 CSV Import with Validation**: Detailed audit report displaying `Total Rows`, `Valid Rows`, `Invalid Rows`, and `Duplicate Rows`.

### 6. Question Bank & SaaS Dashboard
- **KPI Metrics**: Total PDFs, Total Questions, Approved Questions, Pending Review, Low Confidence, and Category breakdown.
- **Duplicate Detection**: Fast string normalization and matching that marks potential duplicate questions with options to `Keep` or `Delete Duplicate`.
- **Advanced Filtering & Search**: Instant debounced search across question prompt, options, and answers, filterable by Status, Confidence, and Category.
- **Bulk Actions**: Select All, Bulk Approve, Bulk Delete, Bulk Export to CSV, Bulk Vector SVG Bundle download.

---

## 📁 System Architecture & Directory Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── extract/route.ts              # PDF extraction endpoint
│   │   │   ├── ocr/route.ts                  # Tesseract OCR fallback endpoint
│   │   │   ├── pdfs/
│   │   │   │   ├── upload/route.ts           # POST /api/pdfs/upload (with size validation)
│   │   │   │   ├── [id]/process/route.ts     # POST /api/pdfs/:id/process
│   │   │   │   └── [id]/status/route.ts      # GET /api/pdfs/:id/status
│   │   │   └── questions/
│   │   │       ├── route.ts                  # GET /api/questions (filter, search, paginate)
│   │   │       ├── [id]/route.ts             # GET, PUT, DELETE /api/questions/:id
│   │   │       ├── [id]/approve/route.ts     # PATCH /api/questions/:id/approve
│   │   │       ├── bulk-approve/route.ts     # PATCH /api/questions/bulk-approve
│   │   │       ├── export/csv/route.ts       # GET /api/questions/export/csv (Section 46 contract)
│   │   │       └── import/csv/route.ts       # POST /api/questions/import/csv (Section 18 validator)
│   │   ├── layout.tsx                        # Global theme provider and header
│   │   └── page.tsx                          # Unified SaaS portal (Dashboard, Extractor, Question Bank, SVG Studio)
│   ├── components/
│   │   ├── dashboard-view.tsx                # SaaS KPI cards, stats, quick shortcuts
│   │   ├── question-bank-view.tsx            # Full-featured Question Bank table with bulk actions
│   │   ├── svg-editor-modal.tsx              # Interactive Visual SVG Studio & previewer
│   │   ├── manual-question-modal.tsx         # Manual question creator modal
│   │   ├── csv-import-modal.tsx              # CSV Import & row validation modal
│   │   ├── pdf-uploader.tsx                  # Drag-and-Drop PDF uploader with progress
│   │   ├── pdf-preview.tsx                   # Interactive PDF document viewer
│   │   ├── question-card.tsx                 # Question review card with answer detection
│   │   ├── question-editor.tsx               # In-place modal editor for questions & options
│   │   └── export-menu.tsx                   # Multi-format exporter (Excel, Word, CSV, JSON, TXT, SVG ZIP)
│   ├── lib/
│   │   ├── question-parser.ts                # Robust noise-filtering MCQ parsing engine
│   │   ├── answer-parser.ts                  # Inline answers & standalone answer key mapper
│   │   ├── csv-manager.ts                    # Section 46 CSV generator & Section 18 CSV parser
│   │   ├── question-store.ts                 # Client-side persistent storage and filter engine
│   │   ├── server-store.ts                   # Server-side singleton store for REST APIs
│   │   ├── text-normalizer.ts                # Bengali/English numerals & option normalizer
│   │   ├── pdf-parser.ts                     # High-density text extractor
│   │   ├── svg/
│   │   │   └── svg-generator.ts              # Programmatic vector SVG layout & ZIP generator
│   │   └── ocr/
│   │       └── ocr-provider.ts               # Pluggable OCR engine (Tesseract.js, Google Vision, Cloud AI)
│   └── types/
│       └── question.ts                       # Complete TypeScript schemas & converters
└── tests/
    ├── test-mcq-parser.mts                   # Parser accuracy test
    ├── test-noise-and-separation.mts         # Section 9 noise rejection & anti-hallucination test
    ├── test-csv-and-svg.mts                  # Section 46 CSV & Vector SVG engine test
    ├── test-export.mts                       # Multi-format export test
    └── test-all-samples-e2e.mts              # End-to-end extraction across sample examination papers
```

---

## 📋 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/pdfs/upload` | Upload PDF file (validates MIME and size up to 150MB) |
| `POST` | `/api/pdfs/:id/process` | Initiate question extraction & parsing pipeline |
| `GET` | `/api/pdfs/:id/status` | Retrieve processing job progress and step state |
| `GET` | `/api/questions` | List questions with search, category, status, and pagination |
| `POST` | `/api/questions` | Create a new question or bulk synchronize questions |
| `GET` | `/api/questions/:id` | Get details of a single question |
| `PUT` | `/api/questions/:id` | Update question statement, options, or answer |
| `DELETE` | `/api/questions/:id` | Permanently remove a question |
| `PATCH` | `/api/questions/:id/approve` | Approve question and transition status to verified |
| `PATCH` | `/api/questions/bulk-approve` | Bulk approve an array of question IDs |
| `GET` | `/api/questions/export/csv` | Download approved questions conforming to Section 46 CSV |
| `POST` | `/api/questions/import/csv` | Upload and validate CSV conforming to Section 18 |

---

## 🛠️ Getting Started

### Prerequisites
- Node.js >= 18.17.0
- npm or pnpm or yarn

### 1. Clone & Install
```bash
git clone https://github.com/SamiumBashir/pdfToMcqExtractor.git
cd pdfToMcqExtractor
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure keys as needed:
```env
# Optional AI & OCR Providers
OCR_API_KEY=
AI_API_KEY=
GEMINI_API_KEY=

# File Upload Limit (default: 150MB in bytes)
MAX_FILE_SIZE=157286400
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Test Suite
```bash
npx tsx tests/test-noise-and-separation.mts
npx tsx tests/test-csv-and-svg.mts
npx tsx tests/test-all-samples-e2e.mts
npx tsx tests/test-export.mts
```

### 5. Production Build
```bash
npm run build
npm run start
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
