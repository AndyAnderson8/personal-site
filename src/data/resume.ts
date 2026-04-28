export interface ResumeLink {
  label: string
  url: string
}

export interface ResumeBlock {
  id: string
  title: string
  subtitle?: string
  date?: string
  location?: string
  bullets?: string[]
  tags?: string[]
  links?: ResumeLink[]
  detail?: string
  icon?: string
  imageUrl?: string
}

export interface ResumeSection {
  id: string
  heading: string
  blocks: ResumeBlock[]
}

export interface ResumeData {
  name: string
  email: string


  location: string
  linkedin: string
  summary: string
  sections: ResumeSection[]
}

export const resume: ResumeData = {
  name: 'Andy Anderson',
  email: 'andy@andylabs.org',


  location: 'Phoenix, AZ',
  linkedin: 'https://www.linkedin.com/in/andyanderson8',
  summary:
    'Software engineer specializing in secure backend development, with experience designing, building, and maintaining dynamic, data-driven applications. Skilled in the full software development life cycle, from analyzing business needs to implementation, testing, and post-deployment support. Strong knowledge of microservices, relational databases, cloud deployment, and skilled in working across collaborative agile development environments.',
  sections: [
    {
      id: 'skills',
      heading: 'Skills',
      blocks: [
        {
          id: 'skills-languages',
          title: 'Languages',
          detail: 'Primary languages used across professional and personal projects.',
          tags: ['Python', 'JavaScript', 'C#', 'Java', 'SQL', 'HTML/CSS'],
        },
        {
          id: 'skills-frameworks',
          title: 'Frameworks & Architecture',
          detail: 'Frameworks and architectural patterns applied in production systems.',
          tags: ['.NET Core', 'ASP.NET', 'REST APIs', 'Microservices', 'Vue.js', 'React.JS', 'AngularJS'],
        },
        {
          id: 'skills-tools',
          title: 'Tools & Platforms',
          detail: 'Platforms, databases, and tooling used day-to-day.',
          tags: ['AWS', 'Azure', 'MS SQL Server', 'MySQL', 'Visual Studio', 'Git', 'Jenkins'],
        },
      ],
    },
    {
      id: 'education',
      heading: 'Education',
      blocks: [
        {
          id: 'wgu',
          title: 'Western Governors University',
          subtitle: 'B.S. in Computer Science',
          date: 'Oct 2023',
          location: 'Salt Lake City, UT',
          icon: '/wgu.png',
          tags: ['Computer Science', 'Dean\'s Merit Scholarship', 'National Honors Society'],
          detail:
            'Graduated with a 3.97 GPA in an accelerated self-paced program. Awarded the Dean\'s Merit Scholarship and recognized by the National Honors Society.',
          links: [
            { label: 'Western Governors University', url: 'https://www.wgu.edu' },
          ],
        },
      ],
    },
    {
      id: 'experience',
      heading: 'Work Experience',
      blocks: [
        {
          id: 'microchip',
          title: 'Backend Engineer',
          subtitle: 'Microchip Technology',
          date: 'Oct 2025 – Present',
          location: 'Phoenix, AZ',
          icon: '/mchp.png',
          bullets: [
            'Leading system architecture and backend development of a real-time semiconductor inventory, pricing, and sourcing platform for authorized distributors, projected to support over $30M in annual transaction volume.',
            'Identified and remediated critical client-side field manipulation and spoofing vulnerabilities in checkout flow by implementing stricter server-side validation and data integrity controls to prevent fraud and inventory loss.',
            'Integrating Retrieval-Augmented Generation (RAG) into internal LLMs to deliver contextual, data-driven answers from product datasheets and documentation, accelerating engineering design and development workflows.',
          ],
          tags: ['Backend', 'C#', '.NET Core', 'Security', 'RAG', 'LLM', 'Microservices', 'SQL'],
          detail:
            'Backend engineering role at a leading semiconductor company. Leading architecture of a real-time distributor platform projected at $30M+ in volume, while also working on security hardening and AI/RAG integrations for internal tooling.',
          links: [
            { label: 'Microchip Technology', url: 'https://www.microchip.com' },
          ],
        },
        {
          id: 'marcus-engineering',
          title: 'Software Security Engineer',
          subtitle: 'Marcus Engineering',
          date: 'Jan 2024 – Oct 2025',
          location: 'Tucson, AZ',
          icon: '/mengr.png',
          bullets: [
            'Designed and developed a distributed, multi-tiered GPS tracking and IoT web platform for portable elevator lifts using C# and .NET Core, building responsive dashboards with real-time telemetry for a $600k contract.',
            'Identified and reported security vulnerabilities in the REST API endpoints for an industry-leading semiconductor company\'s conference web application while in attendance, earning executive recognition.',
            'Designed relational databases in MS SQL Server and secure key management in Azure for medical instrument reprocessing applications, enabling high-volume ingestion with 50% faster queries than previous implementations.',
            'Developed a desktop application for USB specification testing and validation, including power delivery and transfer speed; licensed for use in certifying military-adjacent mobile products, reducing time-to-market by six months.',
            'Contributed to adoption of Git flow standards, CI/CD pipelines in Jenkins, and standardized testing frameworks, helping reduce deployment times and improve code quality across projects.',
            'Facilitated requirements gathering, algorithm design, solution implementation, and post-deployment customer support for consulting clients, helping secure repeat contracts and long-term relationships with 4 large companies.',
            'Mentored interns through code reviews and design pattern guidance, reducing onboarding time and improving collaboration and code quality across the team.',
          ],
          tags: ['C#', '.NET Core', 'IoT', 'Security', 'Azure', 'MS SQL Server', 'Jenkins', 'CI/CD', 'REST APIs'],
          detail:
            'Full-stack security-focused engineering role spanning IoT platforms, secure database design, desktop tooling, and client consulting. Delivered a $600k GPS/telemetry platform, earned executive recognition for responsible vulnerability disclosure, and mentored interns.',
          links: [
            { label: 'Marcus Engineering', url: 'https://www.marcusengineering.com' },
          ],
        },
        {
          id: 'seedscape',
          title: 'Undergraduate Researcher (Software)',
          subtitle: 'Seedscape Ecology Laboratory',
          date: 'Sep 2020 – May 2021',
          location: 'Logan, UT',
          icon: '/seedscape.png',
          bullets: [
            'Developed analysis software in Python and scripts in R to evaluate collected biochemical data.',
            'Contributed to research leading to $1M NSF grant and scientific journal publication.',
          ],
          tags: ['Python', 'R', 'Data Analysis', 'Research', 'NSF Grant'],
          detail:
            'Built data analysis pipelines in Python and R for biochemical research datasets. Contributions helped secure a $1M NSF research grant and resulted in a peer-reviewed journal publication.',
          links: [
            { label: 'Seedscape Ecology Laboratory', url: 'https://seedscape.github.io/BeckmanLab/' },
          ],
        },
      ],
    },
    {
      id: 'projects',
      heading: 'Personal Projects',
      blocks: [
        {
          id: 'brickplanet-sniper',
          title: 'BrickPlanet Sniper',
          icon: '/sniper.png',
          bullets: [
            'Built a virtual collectible item purchase bot using RESTful APIs and HTTP requests; scaled to 30+ recurring paid users as a monetized SaaS.',
          ],
          tags: ['Python', 'REST APIs', 'SaaS', 'Web Automation'],
          detail:
            'A Python bot that monitors BrickPlanet\'s API endpoints and executes purchase requests within milliseconds of collectible drops. Grew to 30+ paying subscribers as a small monetized SaaS.',
          imageUrl: '/sniper-hero.png',
          links: [
            { label: 'BrickPlanet Sniper on GitHub', url: 'https://github.com/AndyAnderson8/bp-tools' },
          ],
        },
        {
          id: 'everything-toolbar',
          title: 'Everything Toolbar',
          icon: '/everything.png',
          bullets: [
            'Contributed to an open-source C# desktop file search tool with over 12k stars on GitHub.',
          ],
          tags: ['C#', 'Open Source', 'Desktop', 'Windows'],
          detail:
            'Open-source contributor to Everything Toolbar, a C# Windows desktop utility integrating the Everything search engine into the taskbar. The project has over 12,000 GitHub stars.',
          imageUrl: '/everything-hero.png',
          links: [
            { label: 'Everything Toolbar on GitHub', url: 'https://github.com/srwi/EverythingToolbar' },
          ],
        },
        {
          id: 'to-the-moon',
          title: 'To The Moon',
          bullets: [
            'Developed an Android mobile game where players physically throw their phones in the air for points.',
          ],
          tags: ['Android', 'Mobile', 'Game Dev', 'Java'],
          detail:
            'An Android game that uses the accelerometer to measure how high players can throw their phone. Built for fun as an experiment in mobile sensor programming.',
          imageUrl: '/moon-hero.png',
          links: [
            { label: 'To The Moon on GitHub', url: 'https://github.com/AndyAnderson8/to-the-moon' },
          ],
        },
      ],
    },
  ],
}
