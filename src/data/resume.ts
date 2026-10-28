// Public resume. The /resume page renders this, and `npm run resume:pdf` prints that page to
// public/ as the downloadable PDF. Keep it in sync with the private /Resume.pdf, minus the phone number.

export const resume = {
  headline: 'Backend Engineer (AI/LLM) · Python · Azure · Generative AI',
  summary:
    'Backend engineer with 4+ years of experience building production AI systems in Python on Azure, specializing in generative AI, LLM integration (GPT-4.1, Claude), RAG, AI agents and event-driven serverless microservices. Experienced in system design, client delivery, end-to-end ownership and mentoring 8 junior developers.',
  experience: [
    {
      role: 'Full Stack Python Developer',
      company: 'Dentsu',
      location: 'Gurugram, India',
      period: 'Nov 2025 – Present',
      bullets: [
        "Architected the multi-tenant backend of Dentsu's GenAI creative platform: 65+ Azure Durable Functions orchestrating 6 AI services to produce 300+ ad creatives monthly for 3 global brands.",
        'Pioneered flagship hero-object-preserving image generation from R&D to production, where Claude Vision (AWS Bedrock) finds placement surfaces and Firefly composites the real product with 100% product fidelity.',
        'Engineered fault-tolerant pipelines within APIM gateway timeouts using a stage-per-poll state machine, 3-tier LLM fallback and deferred asset uploads, reducing 504 failures tracked in Application Insights.',
        'Implemented tenant isolation for 3 brands (JWT, Key Vault secrets, quotas, feature flags), a provider-agnostic video layer (TikTok, Veo) and Event Hub upload scheduling.',
        'Standardized creative quality with LLM-as-judge scoring and human review, and turned brand-guideline PDFs into Cosmos DB rule sets, cutting regenerations by 20%+.',
        'Automated pull-request reviews with a GitHub Copilot AI skill adopted team-wide, running multi-pass checks of large PRs with 4 severity levels.',
      ],
    },
    {
      role: 'Backend Software Developer',
      company: 'Celebal Technologies',
      location: 'Jaipur, India',
      period: 'Sep 2022 – Nov 2025',
      bullets: [
        'Led an intelligent document processing backend for financial firms (Azure Document Intelligence, Azure OpenAI), handling 30,000+ documents monthly at 99.9% uptime and reducing manual work by 60%.',
        'Delivered a Django call-analytics platform on cloud and on-premises Docker containers, analyzing 50,000+ interactions monthly with Azure Speech and Language at 90% accuracy, cutting manual review by 70%.',
        'Scaled an ML SaaS product to 1M+ data requests per day with 50+ FastAPI REST APIs on Azure Functions, improving processing efficiency by 40% and reporting accuracy by 25%.',
        'Partnered with clients from requirements to delivery, mentored 8 junior developers, built Azure DevOps CI/CD pipelines and PyTest suites, and migrated on-premises workloads to Azure.',
      ],
    },
  ],
  projects: [
    {
      name: 'Enterprise Knowledge Assistant: Multi-Source Agentic RAG',
      role: 'Sole Architect and Backend Developer (Freelance)',
      bullets: [
        'Developed a LangGraph RAG system on Azure AI Search where a router agent sends sub-questions to 4+ sources (SharePoint, Cosmos DB, SQL, web) and merges ranked, cited answers.',
        'Established document-level RBAC at retrieval, validated text-to-SQL, jailbreak guardrails and LLM-graded evaluation for 50–100 concurrent users, shrinking policy search from 10–15 minutes to seconds.',
      ],
    },
  ],
  skills: [
    'Python',
    'FastAPI',
    'REST APIs',
    'Microservices',
    'Generative AI',
    'RAG',
    'AI Agents',
    'LangChain',
    'LangGraph',
    'Azure OpenAI',
    'LLM Evaluation',
    'Azure Functions',
    'Cosmos DB',
    'PostgreSQL',
    'Docker',
  ],
  education: {
    degree: 'Bachelor of Technology (B.Tech), Electronics and Communication Engineering',
    school: 'Techno Main Salt Lake, Kolkata',
    detail: 'CGPA: 9.15/10',
    period: 'Jul 2019 – Jun 2023',
  },
  certifications: [
    'Microsoft Certified: Azure Fundamentals (AZ-900)',
    'Microsoft Certified: Azure AI Fundamentals (AI-900)',
  ],
};
