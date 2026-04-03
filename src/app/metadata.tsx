
export const skills = [
  "Java","Python","Go","C/C++","TypeScript","Rust","SQL",
  "React","Next.js","Node","FastAPI","PostgreSQL","Redis",
  "AWS","Docker","PyTorch","TensorFlow","OpenCV",
];

export const experience = [
  {
    date: "Aug – Dec '25",
    role: "Forward Deployed Engineer",
    co: "Wedge (YC S25)",
    desc: "Forward deployed engineering consultant building a clinician dashboard for LA General Medical Center.",
  },
  {
    date: "Jun – Aug '25",
    role: "Software Engineer Intern",
    co: "Anchor Logics (Backed by Berkeley Skydeck)",
    desc: `Built an end-to-end (0→1) telemetry platform, Propriologics, (Next.js, TypeScript, Node/Express, AWS S3) to stream and visualize 3D kinematic motion data from IoT sensor vests, supporting 50+ patients (ALS, Parkinson’s) with personalized vest. weight adjustments to improve movement stability.
    Built video motion analysis pipeline (OpenPose, YOLOv12, DeepSORT, OpenCV), reduced clinical review time by 80%.
    Engineered high-throughput caching and storage layer using AWS S3, Redis, and PostgreSQL to manage 1,000+ CV models and clinical datasets, reducing data load latency by 60%.
    Implemented end-to-end Stripe checkout flows and integrated AWS S3 for secure and automated digital product delivery, enhancing payment processing efficiency.`,
  },
  {
    date: "Apr – Jun '25",
    role: "Software Engineer Intern",
    co: "Digpath.ai (Backed by Berkeley Skydeck)",
    desc: `Developed serverless analytics dashboard using AWS Amplify, Lambda, and DynamoDB to track pathology image ingestion, storage usage, and case volume across large medical imaging pipelines.
    Built SageMaker-based cell segmentation tool using Meta SAM model, automating pathology annotation & analysis.
    Optimized React frontend through code splitting, lazy loading, and render profiling — reducing page load time by 20% and improving responsiveness across medical imaging workflows.`,
  },
  {
    date: "Aug '24 - PRESENT",
    role: "Director",
    co: "Cal Hacks",
    link: "https://calhacks.io/",
    desc: `Organizing the world's biggest collegiate hackathon is equal parts exhilarating and chaos. 4,000 hackers, 36 hours, zero sleep. 
    Engineered an end-to-end sponsorship pipeline reaching 2,000+ companies (14,000+ contacts), directly contributing to USD$900,000+ in sponsorship revenue.`,
  },
  {
    date: "Nov '25 - PRESENT",
    role: "Teaching Assistant",
    co: "UC Berkeley · Full Stack Development",
    link: "https://fullstackdecal.com/",
    desc: "Lead lectures, curriculum delivery, and office hours for 100+ students per semester across frontend (React, Next.js, UI/UX), backend (Node.js, Express, Flask, Django, REST APIs, authentication), databases (MongoDB, SQL, ORMs, Firebase), and DevOps.",
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
