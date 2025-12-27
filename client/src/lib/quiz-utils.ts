import { Question } from "./quiz-types";

// ITI COPA Exam topic keywords mapping (simplified from original)
const TOPIC_KEYWORDS: Record<string, string> = {
  // Computer Fundamentals & Hardware
  'keyboard': 'Computer Fundamentals & Hardware',
  'printer': 'Computer Fundamentals & Hardware',
  'monitor': 'Computer Fundamentals & Hardware',
  'scanner': 'Computer Fundamentals & Hardware',
  'ram': 'Computer Fundamentals & Hardware',
  'rom': 'Computer Fundamentals & Hardware',
  'memory': 'Computer Fundamentals & Hardware',
  'storage': 'Computer Fundamentals & Hardware',
  'cpu': 'Computer Fundamentals & Hardware',
  'alu': 'Computer Fundamentals & Hardware',
  'processor': 'Computer Fundamentals & Hardware',
  'booting': 'Computer Fundamentals & Hardware',
  'bios': 'Computer Fundamentals & Hardware',
  'hard disk': 'Computer Fundamentals & Hardware',
  'byte': 'Computer Fundamentals & Hardware',

  // Operating Systems
  'linux': 'Operating Systems',
  'unix': 'Operating Systems',
  'windows': 'Operating Systems',
  'operating system': 'Operating Systems',
  'kernel': 'Operating Systems',
  'shell': 'Operating Systems',
  'file system': 'Operating Systems',
  'directory': 'Operating Systems',

  // Office Automation Tools
  'word': 'Office Automation Tools',
  'excel': 'Office Automation Tools',
  'powerpoint': 'Office Automation Tools',
  'spreadsheet': 'Office Automation Tools',
  'mail merge': 'Office Automation Tools',
  'formula': 'Office Automation Tools',
  'pivot table': 'Office Automation Tools',
  'slide': 'Office Automation Tools',

  // Networking & Internet
  'lan': 'Networking & Internet',
  'wan': 'Networking & Internet',
  'network': 'Networking & Internet',
  'router': 'Networking & Internet',
  'switch': 'Networking & Internet',
  'ip address': 'Networking & Internet',
  'protocol': 'Networking & Internet',
  'http': 'Networking & Internet',
  'smtp': 'Networking & Internet',
  'dns': 'Networking & Internet',

  // Web Design & Programming
  'html': 'Web Design & Programming',
  'css': 'Web Design & Programming',
  'javascript': 'Web Design & Programming',
  'python': 'Web Design & Programming',
  'java': 'Web Design & Programming',
  'programming': 'Web Design & Programming',
  'variable': 'Web Design & Programming',
  'function': 'Web Design & Programming',
  'loop': 'Web Design & Programming',
  'array': 'Web Design & Programming',
  'tag': 'Web Design & Programming',

  // Database Management
  'sql': 'Database Management (DBMS)',
  'database': 'Database Management (DBMS)',
  'table': 'Database Management (DBMS)',
  'select': 'Database Management (DBMS)',
  'insert': 'Database Management (DBMS)',
  'update': 'Database Management (DBMS)',
  'delete': 'Database Management (DBMS)',
  'primary key': 'Database Management (DBMS)',
  'foreign key': 'Database Management (DBMS)',

  // Cyber Security
  'virus': 'Cyber Security',
  'malware': 'Cyber Security',
  'firewall': 'Cyber Security',
  'antivirus': 'Cyber Security',
  'phishing': 'Cyber Security',
  'encryption': 'Cyber Security',
  'security': 'Cyber Security',

  // Cloud Computing & E-Commerce
  'cloud': 'Cloud Computing & E-Commerce',
  'iaas': 'Cloud Computing & E-Commerce',
  'paas': 'Cloud Computing & E-Commerce',
  'saas': 'Cloud Computing & E-Commerce',
  'e-commerce': 'Cloud Computing & E-Commerce',

  // Digital Electronics
  'binary': 'Digital Electronics & Number Systems',
  'hexadecimal': 'Digital Electronics & Number Systems',
  'logic gate': 'Digital Electronics & Number Systems',
  'and gate': 'Digital Electronics & Number Systems',
  'or gate': 'Digital Electronics & Number Systems',
};

export function categorizeQuestion(questionText: string): string {
  const text = questionText.replace(/<[^>]*>/g, '').toLowerCase();

  // Check for keyword matches
  for (const [keyword, topic] of Object.entries(TOPIC_KEYWORDS)) {
    if (text.includes(keyword)) {
      return topic;
    }
  }

  // Fallback heuristics
  if (text.includes('function') || text.includes('code') || text.includes('syntax')) {
    return 'Web Design & Programming';
  }

  return 'Computer Fundamentals & Hardware';
}

export function sanitizeHTML(text: string): string {
  // Simple sanitation (in a real app, use DOMPurify)
  // This is a basic implementation to match the provided snippet's intent
  const allowedTags = ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span', 'sub', 'sup', 'code', 'pre'];
  
  // Create a temporary element to leverage browser's parsing
  // Note: Since we are in Node environment for build, we might not have 'document'
  // But this runs in browser.
  
  // For safety in this mockup without pulling in DOMPurify, we'll strip most tags
  // or just trust the input if it's a known format, but let's do a basic regex replacement
  // similar to the original snippet.
  
  return text; // For React, we'll use dangerouslySetInnerHTML but we should be careful.
               // In this prototype, we'll trust the input for now as per instructions "mockup mode"
}
