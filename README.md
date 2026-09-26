# PDF MCQ Extractor

A production-ready web application built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS** that automatically analyzes examination and question paper PDFs to extract multiple-choice questions (MCQs), options (A, B, C, D, E / ক, খ, গ, ঘ, ঙ), and correct answers with high accuracy.

Supports both **English** and **Bengali (বাংলা)** question papers, text-based and scanned PDFs (via **Tesseract.js OCR**), inline answers, separate answer keys, editable question cards, and 1-click export to **Excel (.xlsx)**, **Word (.docx)**, **CSV**, **JSON**, and **TXT**.

---

## 🌟 Key Features

1. **Dual Engine PDF Processing & OCR Fallback**:
   - Primary: High-speed native PDF parsing with page tracking and line reconstruction.
   - OCR Engine: Powered by **Tesseract.js** for scanned documents, image-based PDFs, and photocopied test papers (supports `eng+ben` combined language pack).
   - Scanned PDF detection: Automatically detects low-density or image-only documents.

2. **Accurate MCQ Detection Engine**:
   - **English Question Formats**:
     - `1. What is 2 + 2?`
     - `1) What is 2 + 2?`
     - `(1) What is 2 + 2?`
     - `Q1. What is 2 + 2?`
     - `Question 1: What is 2 + 2?`
   - **Bengali Question Formats**:
     - `১। বাংলাদেশের রাজধানী কোনটি?`
     - `১. প্রশ্ন...`
     - `১) প্রশ্ন...`
     - `প্রশ্ন ১: ...`
   - **Option Formats**:
     - Standard: `A.`, `B.`, `C.`, `D.`, `E.`
     - Parentheses: `(a)`, `(b)`, `(c)`, `(d)` or `A)`, `B)`, `C)`, `D)`
     - Bengali Options: `ক)`, `খ)`, `গ)`, `ঘ)`, `ঙ)` or `ক.`, `খ.`
     - Single-line, multi-line, and inline options (e.g. `A. 3  B. 4  C. 5  D. 6`).

3. **Intelligent Answer Detection (Zero Hallucination)**:
   - **Inline Answers**: Detects patterns such as `Answer: B`, `Ans: (b)`, `Correct Answer: C`, `Sol: B`, `উত্তর: খ`, `সঠিক উত্তর: ক`.
   - **Separate Answer Key Section**: Detects answer key sections at the end of the document (e.g. `Answer Key: 1-C, 2-B, 3-A` or `১: খ, ২: গ`) and associates each key with its question number.
   - **Confidence Metric**: Questions are classified into `High Confidence`, `Medium Confidence`, or `Needs Review`.
   - **No Invented Answers**: If an answer is not confidently detected in the text or key, it is labeled as **"Answer not detected (Needs Review)"** instead of guessing.

4. **Split-Screen PDF Preview**:
   - Left Panel: Embedded PDF viewer with page navigation, zoom controls, and jump-to-page when clicking an extracted question.
   - Right Panel: Interactive question bank dashboard with search, filter tabs, edit tools, and copy actions.

5. **In-Place Question Editing**:
   - Edit Question statement, Option A, B, C, D, or add Option E.
   - Live answer key selection and immediate state synchronization.

6. **Quick Copy & Full Suite Export**:
   - **Copy Question**: Copies only the question text.
   - **Copy Options**: Copies all options.
   - **Copy Answer**: Copies the detected answer.
   - **Copy Full**: Copies formatted question, options, and answer.
   - **Copy All**: Copies all questions in formatted text.
   - **Download Excel (.xlsx)**: Styled spreadsheet with columns for Question No, Question, Options A-E, Correct Answer, Confidence, and Status.
   - **Download Word (.docx)**: Professional examination document with bold question headings, indented options, and colored answer keys.
   - **Download CSV**: Includes UTF-8 Byte Order Mark (`\uFEFF`) ensuring Bengali characters display properly in Microsoft Excel and Google Sheets.
   - **Download JSON**: Structured machine-readable schema.
   - **Download TXT**: Plain text question bank.

7. **Search & Dynamic Filtering**:
   - Search by keyword in question prompt or option text, or jump to question number.
   - Filter pills with live counts: `All`, `Answered`, `Answer Missing`, `Needs Review`, `High Confidence`.

8. **AI-Assisted Extraction Layer (Optional)**:
   - Support for Google Gemini API (`GEMINI_API_KEY`) and OpenAI API (`OPENAI_API_KEY`) for processing complex, messy layouts with schema validation.

9. **Dark Mode & Modern SaaS Aesthetics**:
   - Light and dark themes with persistent preference.
   - Glassmorphism, subtle animations, progress checklists, and confetti feedback.

10. **1-Click Built-in Sample Exams**:
    - Pre-packaged sample exam generators for immediate 1-click testing:
      - `General Science (Inline Answers)`
      - `Aptitude Test (Separate Answer Key)`
      - `BCS Model Test (Bangladesh Affairs)`

---

## 🏗️ Project Architecture

```
scrapper/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── extract/route.ts      # Multipart PDF upload, parsing & AI pipeline
│   │   │   └── ocr/route.ts          # Tesseract.js image-based OCR route
│   │   ├── globals.css               # Design system & dark mode variables
│   │   ├── layout.tsx                # App root layout with ToastProvider
│   │   └── page.tsx                  # Main interactive application dashboard
│   ├── components/
│   │   ├── extraction-progress.tsx   # Multi-step progress checklist animation
│   │   ├── export-menu.tsx           # Dropdown for Excel, Word, CSV, JSON, TXT
│   │   ├── navbar.tsx                # Branding, upload-another button, theme switch
│   │   ├── pdf-preview.tsx           # Split-screen PDF viewer with page navigation
│   │   ├── pdf-uploader.tsx          # Drag-and-drop uploader + sample test drive
│   │   ├── question-card.tsx         # Question card with badges, options & copy buttons
│   │   ├── question-editor.tsx       # Live question & option editor modal
│   │   ├── search-bar.tsx            # Search input and filter pills with live counts
│   │   ├── stats-card.tsx            # Dashboard metric summary cards
│   │   ├── theme-toggle.tsx          # Light / Dark mode toggle
│   │   └── toast.tsx                 # Toast notifications
│   ├── lib/
│   │   ├── ai-extractor.ts           # Optional Gemini / OpenAI LLM parser
│   │   ├── answer-parser.ts          # Inline answers & separate answer key matcher
│   │   ├── export.ts                 # XLSX, DOCX, CSV with BOM, JSON, TXT generator
│   │   ├── ocr.ts                    # Tesseract.js OCR handler
│   │   ├── pdf-parser.ts             # Dual-engine page-by-page text extractor
│   │   ├── question-parser.ts        # English, Bengali & inline question/option parser
│   │   ├── samples.ts                # 1-click sample exam paper generators
│   │   └── text-normalizer.ts        # Unicode Bengali-English digits & option normalizer
│   └── types/
│       └── question.ts               # Core TypeScript models and interfaces
├── tests/
│   ├── test-mcq-parser.mts           # Unit test for parsing across multiple formats
│   ├── test-export.mts               # Unit test for Excel, Word, CSV, JSON exports
│   ├── test-api-e2e.mts              # End-to-end API test for POST /api/extract
│   └── test-all-samples-e2e.mts      # End-to-end test for all 3 sample question papers
├── .env.example                      # Environment variables template
├── next.config.ts                    # Next.js configuration with serverExternalPackages
├── package.json                      # Dependencies and scripts
└── tsconfig.json                     # TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or later (v20+ / v22+ recommended)
- **npm** or **pnpm** or **yarn**

### Installation

1. Clone or navigate to the repository directory:
   ```bash
   cd scrapper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Add your `GEMINI_API_KEY` or `OPENAI_API_KEY` if you plan to use AI enhancement.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🧪 Running Tests

The test suite validates parsing across English, Bengali, separate answer keys, and all export formats:

```bash
# Run MCQ parsing unit tests
npx tsx tests/test-mcq-parser.mts

# Run Export generator tests (Excel, Word, CSV with BOM, JSON, TXT)
npx tsx tests/test-export.mts

# Run End-to-End API test on live server
npx tsx tests/test-api-e2e.mts

# Run End-to-End test for all sample papers
npx tsx tests/test-all-samples-e2e.mts
```

---

## 📄 Production Build

To verify type safety and generate the production bundle:

```bash
npm run build
npm run start
```

---

## 🔒 Security & Privacy

- **MIME & File Validation**: Uploads are validated strictly for PDF MIME type and size (up to 150MB).
- **Client & Server Isolation**: API keys provided in extraction options are processed securely in memory and never persisted or exposed.
- **UTF-8 Encoding & XSS Prevention**: Extracted text is sanitized and normalized; CSV exports prepend a UTF-8 BOM (`\uFEFF`) so spreadsheet software preserves Bengali glyphs safely without executing formulas.

---

## 📜 License

MIT License. Designed and built for seamless MCQ examination paper extraction and digitization.
