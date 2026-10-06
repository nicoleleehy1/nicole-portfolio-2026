export const RESUME_URL = "/Nicole_Lee_Resume_Oct_2026.pdf";
export const skills = [
  "Java","Python","Go","C/C++","TypeScript","Rust","SQL",
  "React","Next.js","Node","FastAPI","PostgreSQL","Redis",
  "AWS","Docker","PyTorch","TensorFlow","OpenCV",
];

export const experience = [
  {
    date: "May – Aug '26",
    role: "Software Engineer Intern",
    co: "Apple ",
    link: "https://www.apple.com/",
    summary: "MCP evaluation & optimization platform",
    desc: [
      "Built a full MCP evaluation platform across 450+ servers, saving $700,000+/year by generating 200+ schema-aware ground truth queries per run and automating live tool calls to cut per-eval time 18x (6+ hrs → 20 mins).",
      "Architected a fault-tolerant tracing proxy intercepting live MCP traffic with response normalization and persistent PostgreSQL state, collapsing 100+ correlated failures into <10 root causes and cutting triage 40%.",
      "Engineered hybrid scoring with deterministic tool-call/JSON diffing + LLM-as-judges; extracted Langfuse traces + A/B runs to analyze routing failures and recommend tool description/routing changes optimizing accuracy, latency & cost.",
    ],
  },
  {
    date: "Aug – Dec '25",
    role: "Forward Deployed Engineer Intern",
    co: "Wedge (YC S25)",
    summary: "Clinician analytics platform for LA General Medical Center",
    desc: [
      "Built a clinician analytics platform for LA General Medical Center (600-bed Level I trauma center) using React, TypeScript, and GraphQL, surfacing EHR and scheduling across 30K+ annual discharges to improve bed turnover.",
      "Architected 20+ reusable frontend components and REST data pipelines for FHIR/HL7 EHR data, adding client-side caching, conflict detection, and utilization scoring to support low-latency analytics under concurrent workloads.",
    ],
  },
  {
    date: "Jun – Aug '25",
    role: "Software Engineer Intern",
    co: "Anchor Logics",
    summary: "Real-time IoT telemetry & computer vision for ALS/Parkinson's patients",
    desc: [
      "Led 5 engineers to ship a real-time telemetry platform that analyzes 3D IMU data streamed from IoT vests used by 50+ ALS/Parkinson's patients, surfacing data visualizations, timeline scrubbers, and playback controls.",
      "Built CV and data infrastructure with YOLOv12, OpenPose, DeepSORT, AWS S3, Redis, and PostgreSQL, improving keypoint consistency 25%, cutting occlusion loss 35%, and supporting 2,000+ models with sub-100ms retrieval.",
    ],
  },
  {
    date: "Aug '24 – Present",
    role: "Director",
    co: "Cal Hacks",
    link: "https://calhacks.io/",
    summary: "Engineering & sponsorships for the largest collegiate hackathon",
    desc: [
      "Built and deployed 3 production websites including live hacker portal, judging system, and public site (React, TypeScript, Supabase, PostgreSQL) and published an iOS app (C, Swift), serving 4,000+ hackers and 60+ sponsors.",
      "Built an automated sponsorship pipeline reaching 2,000+ companies and 14,000+ contacts, raising $1,250,000+.",
    ],
  },
  {
    date: "Apr – Jun '25",
    role: "Software Engineer Intern",
    co: "Digpath.ai",
    summary: "Pathology cell segmentation & serverless analytics",
    desc: [
      "Deployed a SageMaker + Meta SAM cell segmentation pipeline with GPU-accelerated inference across 500+ whole-slide pathology images (70GB dataset); reduced manual annotation turnaround from days to under 2 hours per case.",
      "Optimized a serverless platform (AWS Amplify, Lambda, DynamoDB) tracking pathology image ingestion, storage, and case volume.",
    ],
  },
  {
    date: "Nov '25 – Present",
    role: "Teaching Assistant",
    co: "UC Berkeley · Full Stack Development",
    link: "https://fullstackdecal.com/",
    summary: "Teaching full stack web development to 100+ students",
    desc: [
      "Lead lectures, curriculum delivery, and office hours for 100+ students per semester across frontend (React, Next.js, UI/UX), backend (Node.js, Express, Flask, Django, REST APIs, authentication), databases (MongoDB, SQL, ORMs, Firebase), and DevOps.",
    ],
  },
];

export type Project = {
  name: string;
  event: string;
  desc: string[];
  stack: string;
  link?: string;
  // Optional cover photo in /public; a generated texture is used otherwise.
  image?: string;
  // Optional award shown as a ribbon on the cover, e.g. "1st Place · HackMIT".
  award?: string;
};

export const projects: Project[] = [
  {
    name: "CodeMRI",
    event: "Personal Project",
    link: "https://github.com/nicoleleehy1/CodeMRI",
    desc: [
      "A static-analysis + context compiler for coding agents, parsing repository-wide ASTs into persistent architecture and symbol graphs with call/import dependencies, source navigation, and change-impact analysis.",
      "Compiles change-scoped context, reducing repository-reading tokens by 83% and enabling graph-guided code modifications.",
    ],
    stack: "Python · TypeScript · Tree-sitter · FastAPI",
  },
  {
    name: "Flusk",
    event: "Personal Project",
    link: "https://web-production-5c042.up.railway.app/",
    desc: [
      "A Java LSM-tree storage engine with a full write path (WAL, MemTable, SSTable, 4-tier compaction with tombstone GC, Bloom filters and sparse indexing), exposed through 7 REST endpoints for low-latency reads/writes.",
    ],
    stack: "Java 17 · Maven · Guava · Snappy · JUnit 5 · Railway",
  },
  {
    name: "Stoich",
    event: "Personal Project",
    link: "https://stoich.vercel.app/",
    desc: [
      "A chemistry research tool built on a multi-LLM pipeline and cross-paper vector search, reducing atom-index hallucinations from 67% to under 15%; renders synchronized reaction graphs, equation and mechanism views, annotations, and 3D molecular structures.",
    ],
    stack: "Next.js · TypeScript · MongoDB Atlas · RDKit-JS · 3Dmol.js · D3.js",
  },
  {
    name: "Synapse AI",
    event: "HackMIT 2025",
    link: "https://github.com/nicoleleehy1/synapse",
    desc: [
      "Built an NLP pipeline parsing PDFs into structured knowledge graphs, extracting 200+ concept nodes and typed relationships per document into a Neo4j graph database.",
      "Engineered a React + D3.js frontend rendering 8 synchronized visualization modes (force-directed graph, kanban, timeline, mind map, etc.) with real-time bidirectional edits across all views.",
      "Integrated SM-2 spaced repetition scheduling with LLM-generated flashcards and cloze deletions via Anthropic API, and Exa.ai for semantic web search enrichment.",
    ],
    stack: "Python · TypeScript · React · Neo4j · Anthropic API · spaCy · D3.js",
  },
  {
    name: "ASL Live Translator",
    event: "TreeHacks 2025",
    desc: [
      "Real-time ASL letter recognition converting sign language to speech and live captions for nonverbal users.",
    ],
    stack: "Python · React · OpenCV · MediaPipe · TensorFlow.js",
  },
  {
    name: "Insurmate",
    event: "Bolt Hacks 2025",
    desc: [
      "AI insurance agent — document parsing, policy comparison, and natural language Q&A over coverage details.",
    ],
    stack: "React · TensorFlow.js · LangChain",
  },
];

export const research = [
  {
    date: "Aug '24 – Feb '25",
    role: "ML Researcher",
    co: "University of California, San Francisco",
    desc: "RAG pipeline over 2,000+ neurodegenerative disease papers using FAISS, LangChain, and Gradio.",
  },
  {
    date: "Aug '23 – Sep '24",
    role: "Researcher",
    co: "University of Hong Kong",
    desc: "R-based COVID-19 mobility/admissions correlation tool over 20K+ data points. Computational CRISPR/Nanopore sequencing analysis.",
  },
];

// Archived essays converted from Google Docs; each body is src/content/writings/<slug>.html.
// New posts are .mdx files in that folder and don't need an entry here.
export const essays = [
  // {
  //   slug: "puer-tea-lipase",
  //   title: "How does the change in concentrations (0.00%, 3.00%, 9.00%, 12.00%, 15.00%, 18.00%) of Pu’er tea affect the mean rate of lipase-catalysed triglyceride hydrolysis (min⁻¹) at 37°C as determined by the rate of decrease in pH of milk (sourced by Bos taurus) before and after incubation with lipase (sourced by Sus domesticus) and Pu’er tea for 90 minutes?",
  //   kind: "Biology Internal Assessment",
  //   question: undefined,
  // },
  {
    slug: "burnout-epigenetics",
    title: "The interaction between environmental stressors and predisposed genes in explaining the etiology of Burnout Stress Syndrome",
    kind: "Extended Essay · World Studies (Biology & Psychology)",
    question: "How do environmental stressors affect the epigenetic mechanisms acting on the Serotonin Transporter Gene and Glucocorticoid Receptor Gene on the etiology of Burnout Stress Syndrome in Scandinavian physicians?",
  },
];
