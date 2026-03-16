/**
 * Client-side skill extraction utility
 * This is NOT a server action - can be used on the client side
 * AI-ready: Replace the keyword lists with AI model calls
 */

export function extractSkillsFromResumeText(text: string): {
  technical: string[]
  soft: string[]
  all: string[]
} {
  // Extended tech skills list (140+)
  const technicalSkills = [
    // Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
    'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala', 'Elixir', 'Clojure', 'R',
    'MATLAB', 'Perl', 'Bash', 'Shell', 'SQL',
    // Frontend
    'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt', 'Gatsby',
    'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'Material UI', 'Sass', 'Less',
    'Webpack', 'Vite', 'Babel', 'ESLint', 'Prettier',
    // Backend
    'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring', 'SpringBoot',
    'Laravel', 'Rails', 'ASP.NET', 'Nest.js', 'Koa', 'Hapi',
    // Database
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
    'Firebase', 'Firestore', 'DynamoDB', 'Cassandra', 'Oracle',
    'SQLite', 'MariaDB', 'Neo4j', 'CouchDB',
    // Cloud & DevOps
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins',
    'GitHub Actions', 'GitLab CI', 'CircleCI', 'Travis CI',
    'Terraform', 'Ansible', 'Nginx', 'Apache', 'Linux',
    // APIs & Protocols
    'REST API', 'GraphQL', 'gRPC', 'WebSocket', 'OAuth', 'JWT',
    'HTTP', 'HTTPS', 'XML', 'JSON', 'Protocol Buffers',
    // Testing
    'Jest', 'Mocha', 'Jasmine', 'Pytest', 'JUnit', 'RSpec',
    'Selenium', 'Cypress', 'Playwright', 'React Testing Library',
    // Mobile
    'React Native', 'Flutter', 'iOS', 'Android', 'Xcode', 'Android Studio',
    'SwiftUI', 'Jetpack Compose',
    // Other Tools
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'VS Code', 'IntelliJ',
    'Postman', 'Jira', 'Confluence', 'Slack', 'DataDog',
    'NewRelic', 'Sentry', 'Figma', 'Sketch', 'Adobe XD',
  ]

  // Soft skills
  const softSkills = [
    'Communication', 'Leadership', 'Team Management', 'Problem Solving',
    'Critical Thinking', 'Creativity', 'Adaptability', 'Time Management',
    'Collaboration', 'Project Management', 'Strategic Planning',
    'Presentation', 'Negotiation', 'Mentoring', 'Coaching',
  ]

  const lowerText = text.toLowerCase()
  const foundTechnical = technicalSkills.filter(skill =>
    lowerText.includes(skill.toLowerCase())
  )
  const foundSoft = softSkills.filter(skill =>
    lowerText.includes(skill.toLowerCase())
  )

  return {
    technical: [...new Set(foundTechnical)],
    soft: [...new Set(foundSoft)],
    all: [...new Set([...foundTechnical, ...foundSoft])],
  }
}
