import type { XpEntry } from "../components/xp-list";

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
    date: "Aug '24 – Feb '25",
    role: "ML Researcher",
    co: "University of California, San Francisco",
    link: "https://neuroailab.ucsf.edu/blog/2025/11/12/mac-rag-system",
    summary: "MAC RAG: retrieval-augmented generation over neurodegenerative disease research",
    desc: [
      "Built MAC RAG, a retrieval-augmented generation system grounding GPT-4 Turbo answers in 2,000+ neurodegenerative disease papers from UCSF's Memory and Aging Center faculty, with full citations (author, year, journal, PMID) for every response.",
      "Engineered the retrieval pipeline: overlapping 1,000-character chunking, 384-dim all-MiniLM-L6-v2 sentence embeddings, and exact nearest-neighbor search over a FAISS index, tuning top-k retrieval (k=10) for answer quality.",
      "Deployed a Gradio interface on Hugging Face Spaces surfacing answers alongside supporting passages, used by clinicians at a Clinical Pathology Conference to reference diagnostic criteria and treatment approaches.",
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
  {
    date: "Aug '22 – '23",
    role: "Bioinformatics Intern",
    co: "HKU School of Biomedical Sciences",
    summary: "COVID-19 epidemiological modeling, cancer genomics & Nanopore sequencing",
    desc: [
      "Developed an R-based time-series analysis pipeline cross-correlating community mobility data with COVID-19 case and hospital admission trends across 20K+ data points, quantifying lagged relationships between mobility shifts and transmission during the pandemic.",
      "Supported cancer genomics research in Dr Jason Wong's lab, assisting with Oxford Nanopore long-read sequencing workflows, from library preparation to basecalling and downstream variant analysis.",
      "Led an independent DNA extraction and sequencing study (2023), carrying samples through extraction, quality control, Nanopore sequencing and computational analysis, and co-designed a hands-on wet-lab curriculum for the School of Biomedical Sciences.",
    ],
  },
  // {
  //   date: "Aug '22",
  //   role: "Medical Shadowing",
  //   co: "Sharp Eye Clinic",
  //   summary: "Semi-private ophthalmology clinic",
  //   desc: [
  //     "Shadowed Dr Kenneth Yau in a semi-private ophthalmology clinic and observed cataract surgeries in the surgical unit.",
  //     "Received interview training and insight into medical issues affecting low-income patients.",
  //   ],
  // },
  // {
  //   date: "Aug '22",
  //   role: "Medical Shadowing",
  //   co: "Premier Medical Centre",
  //   summary: "Paediatric cardiology unit",
  //   desc: [
  //     "Shadowed Dr Maurice Leung in the paediatric cardiology unit.",
  //   ],
  // },
];

export type Leadership = {
  date: string;
  role: string;
  co: string;
  summary: string;
  desc: string[];
  // Gallery filter group, from the "Relevance" column of the activities list.
  category: string;
  // Individual titles held within the organisation, most senior first.
  roles?: { title: string; date: string }[];
  link?: string;
  // Optional cover photo in /public, e.g. "/leadership/teensinai.jpg"; a generated texture is used otherwise.
  image?: string;
};

export const leadership: Leadership[] = [
  {
    date: "Aug '24 – Present",
    role: "Director",
    co: "Cal Hacks",
    category: "Technology",
    link: "https://calhacks.io/",
    roles: [
      { title: "Internal Vice President", date: "Fall '26 – Present" },
      { title: "Tech Director", date: "Fall '26 – Present" },
      { title: "Sponsorship Director", date: "Fall '24 – Present" },
      { title: "Hacker Experience & Inclusion Lead", date: "Fall '24 – Fall '25" },
    ],
    summary: "Engineering & sponsorships for the largest collegiate hackathon",
    desc: [
      "Built and deployed 3 production websites including live hacker portal, judging system, and public site (React, TypeScript, Supabase, PostgreSQL) and published an iOS app (C, Swift), serving 4,000+ hackers and 60+ sponsors.",
      "Built an automated sponsorship pipeline reaching 2,000+ companies and 14,000+ contacts, raising $1,250,000+.",
    ],
  },
  {
    date: "",
    role: "Campus Leader",
    co: "Notion @ UC Berkeley",
    category: "Community",
    summary: "",
    desc: [],
  },
  {
    date: "Jan '21 – Present",
    role: "Founder & President",
    co: "TeensinAI Hong Kong",
    category: "Technology",
    summary: "Youngest lead organiser in the global #GirlsinAI hackathon campaigns",
    desc: [
      "Youngest lead organiser at 14 in the global #GirlsinAI 2021, #AdaHack2021, #GirlsinAI2022 and #GirlsinAI2023 hackathon campaigns; hosted 3 hackathons with 300 participants, 8 companies and 50+ mentors.",
      "Oversaw 20 executive team members across 11 departments.",
      "Raised $10,000+ for STEM programs and social service events as a winner of the Kids4Kids Young Entrepreneurship competition and HKIS Dream Fund.",
      "Spoke at 12 events; featured in De Telegraaf and by the UNWEF.",
    ],
  },
  {
    date: "Jul '22 – Present",
    role: "Vice President",
    co: "Hong Kong Outstanding Students' Association",
    category: "Social Service",
    summary: "Raised $200,000+ for youth and social service programs",
    desc: [
      "Fundraised over $200,000 in 2022–23.",
      "Ran Youth Summit 2023 (100+ participants), Children's Cancer Foundation visits, the Social Service Series, the DSE/IB Study Abroad Series, the Annual Themed Luncheon and a mentorship program.",
    ],
  },
  {
    date: "Nov '25 – Present",
    role: "Teaching Assistant",
    co: "UC Berkeley Full Stack Web Development",
    category: "Teaching",
    link: "https://fullstackdecal.com/",
    summary: "Teaching full stack web development to 100+ students",
    desc: [
      "Lead lectures, curriculum delivery, and office hours for 100+ students per semester across frontend (React, Next.js, UI/UX), backend (Node.js, Express, Flask, Django, REST APIs, authentication), databases (MongoDB, SQL, ORMs, Firebase), and DevOps.",
    ],
  },
  {
    date: "",
    role: "Industry Developer",
    co: "Web Development at Berkeley",
    category: "Technology",
    summary: "",
    desc: [],
  },
  {
    date: "",
    role: "Project Chair",
    co: "Bioengineering Honors Society",
    category: "Bioengineering",
    summary: "",
    desc: [],
  },
  {
    date: "Jun '21 – Present",
    role: "Head of Communications & Outreach",
    co: "Fresh Dose Hong Kong",
    category: "Medicine",
    summary: "Biomedical advocacy and community health education",
    desc: [
      "Ran first-aid workshops with several charities.",
      "Managed internal communications and research documents, and published social media posts on medical issues for the community.",
      "Researched and advocated biomedical topics such as organ donation and epigenetics; featured twice on RTHK 3 Common Room Radio.",
    ],
  },
  {
    date: "Aug '18 – Present",
    role: "Deputy Secretary General",
    co: "Model United Nations",
    category: "Social Issues",
    summary: "Chaired 7 conferences and delegated at 20",
    desc: [
      "Deputy Secretary General of WISMUN 2022: organised my school's first in-person conference (100+ delegates).",
      "Executive Committee member (Press Director) at ISMUN 2023, organising Hong Kong's largest MUN conference (400+ attendees).",
      "Head Chair: GSISMUN 2022, DBSMUN 2022, ICSMUN 2022, WISMUN 2023.",
      "Deputy Chair: ISMUN 2022, AISMUN 2021, HKMUN 2023.",
    ],
  },
  {
    date: "Feb '20 – Present",
    role: "Director of Chapters",
    co: "Inter-School Social Issues Association",
    category: "Social Issues",
    summary: "Led 10+ school ambassadors",
    desc: [
      "Director of Chapters (2022–23), overseeing 10+ school ambassadors.",
      "Social Media Manager (2021–22), producing weekly posts.",
      "Writer, Podcaster and Graphic Designer (2020–21).",
    ],
  },
  {
    date: "Jan '20 – Aug '22",
    role: "Hong Kong Regional Ambassador",
    co: "Technovation Girls Challenge",
    category: "Technology",
    summary: "Regional ambassador and 2020 quarterfinalist",
    desc: [
      "Hong Kong Regional Ambassador in 2021 and 2022.",
      "Quarterfinalist in the 2020 Technovation Girls Challenge as founder of Rewhere.",
    ],
  },
  {
    date: "Jun '21 – Jun '22",
    role: "Executive Director of Outreach",
    co: "GirlsinSTEM International",
    category: "Technology",
    summary: "Led a global team of 200 project managers and ambassadors",
    desc: [
      "Oversaw a team of 200 girls, including global project managers and ambassadors.",
      "Partnered with organisations, NGOs and professionals around the world; delegated tasks and hosted monthly meetings.",
    ],
  },
  {
    date: "Mar '22 – Present",
    role: "Co-Founder",
    co: "MedEd HK (West Island School)",
    category: "Medicine",
    summary: "Medical and biomedical society",
    desc: [
      "Co-founded the school's medical and biomedical society and served as its student leader.",
      "Researched, discussed and taught medical topics to students.",
    ],
  },
  {
    date: "'18 – '23",
    role: "House Captain",
    co: "West Island School",
    category: "School",
    summary: "Student leadership roles",
    desc: [
      "House Captain (2022–23).",
      "Pre-16 Student Leader (2021–22).",
      "Senior Digital Leader (2019–20) and Student Ambassador (2018–20).",
      "Student leader for Model United Nations and MedEd HK; core organising member of the ESF Computer Conference.",
    ],
  },
  {
    date: "Jan '21 – Present",
    role: "Chapter Leader",
    co: "Inquisitive Minds Hong Kong",
    category: "Social Service",
    summary: "Tutoring underprivileged children",
    desc: [
      "Led the West Island School chapter.",
      "Tutored English and Mathematics for underprivileged children in Hong Kong.",
    ],
  },
  {
    date: "Feb '22 – Present",
    role: "Researcher",
    co: "Because Mental Health",
    category: "Medicine",
    summary: "Mental health advocacy",
    desc: [
      "Advocated for mental health in the Hong Kong community with a registered Hong Kong charity.",
    ],
  },
  {
    date: "Aug '17 – Jun '20",
    role: "School Ambassador",
    co: "Society for the Relief of Disabled Children",
    category: "Social Service",
    summary: "Fundraising and hospital support",
    desc: [
      "Organised and volunteered at fundraising events.",
      "Delivered medical equipment and toys to the Duchess of Kent Children's Hospital and helped with administration.",
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
  // Optional award shown as a badge on the cover, e.g. "1st Place · HackMIT".
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
  {
    name: "Webinet",
    event: "Young Founders' Summit Asia 2020",
    award: "Semi-Finalist · YFS Asia",
    desc: [
      "An app that surfaces university webinars and courses so students can grow through e-learning, in support of accessible quality education for all (SDG 4).",
    ],
    stack: "Mobile App · EdTech · SDG 4",
  },
];

export const research: XpEntry[] = [
  {
    date: "Aug '24 – Feb '25",
    role: "ML Researcher",
    co: "University of California, San Francisco",
    link: "https://neuroailab.ucsf.edu/blog/2025/11/12/mac-rag-system",
    summary: "MAC RAG: retrieval-augmented generation over neurodegenerative disease research",
    desc: [
      "Built MAC RAG, a retrieval-augmented generation system grounding GPT-4 Turbo answers in 2,000+ neurodegenerative disease papers from UCSF's Memory and Aging Center faculty, with full citations (author, year, journal, PMID) for every response.",
      "Engineered the retrieval pipeline: overlapping 1,000-character chunking, 384-dim all-MiniLM-L6-v2 sentence embeddings, and exact nearest-neighbor search over a FAISS index, tuning top-k retrieval (k=10) for answer quality.",
      "Deployed a Gradio interface on Hugging Face Spaces surfacing answers alongside supporting passages, used by clinicians at a Clinical Pathology Conference to reference diagnostic criteria and treatment approaches.",
    ],
  },
  {
    date: "Aug '23 – Sep '24",
    role: "Researcher",
    co: "University of Hong Kong",
    summary: "COVID-19 epidemiological modeling, cancer genomics & Nanopore sequencing",
    desc: [
      "Developed an R-based time-series analysis pipeline cross-correlating community mobility data with COVID-19 case and hospital admission trends across 20K+ data points, quantifying lagged relationships between mobility shifts and transmission during the pandemic.",
      "Supported cancer genomics research in Dr Jason Wong's lab, assisting with Oxford Nanopore long-read sequencing workflows, from library preparation to basecalling and downstream variant analysis.",
      "Led an independent DNA extraction and sequencing study (2023), carrying samples through extraction, quality control, Nanopore sequencing and computational analysis, and co-designed a hands-on wet-lab curriculum for the School of Biomedical Sciences.",
    ],
  },
  {
    date: "",
    role: "Primary Researcher",
    co: "HK PolyU Junior Researcher Mentorship Program",
    summary: "E-habits and cardiovascular health of secondary school students",
    desc: [
      "Evaluated the e-habits and cardiovascular health of secondary school students in a cardiovascular exercise lab, using an ergometer, plethysmography and questionnaires.",
    ],
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
