import re
import os
import tempfile
from docx import Document


# ============ SKILL DATABASE ============

SKILLS_LIST = [
    # Programming languages
    'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'go', 'rust',
    'php', 'kotlin', 'swift', 'scala', 'perl', 'r', 'matlab', 'dart', 'objective-c',

    # Web / frontend
    'react', 'angular', 'vue', 'nextjs', 'next.js', 'svelte', 'html', 'css',
    'sass', 'tailwind', 'bootstrap', 'jquery', 'redux', 'webpack',

    # Backend frameworks
    'django', 'flask', 'fastapi', 'spring', 'spring boot', 'node', 'nodejs', 'express',
    'nest.js', 'rails', 'laravel', 'asp.net', '.net',

    # Databases
    'sql', 'postgresql', 'postgres', 'mysql', 'sqlite', 'mongodb', 'redis',
    'cassandra', 'dynamodb', 'oracle', 'firebase', 'elasticsearch',

    # DevOps / Cloud
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'google cloud', 'terraform',
    'ansible', 'jenkins', 'ci/cd', 'github actions', 'gitlab ci', 'nginx', 'linux',

    # Data / ML / AI
    'machine learning', 'deep learning', 'nlp', 'computer vision', 'data science',
    'data analytics', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch',
    'keras', 'matplotlib', 'seaborn', 'plotly', 'streamlit', 'opencv',
    'hugging face', 'llm', 'langchain',

    # BI / analytics
    'tableau', 'power bi', 'excel', 'google analytics', 'looker',

    # APIs / architecture
    'rest api', 'restful', 'graphql', 'microservices', 'grpc', 'soap',

    # Mobile
    'android', 'ios', 'react native', 'flutter', 'xamarin',

    # Testing
    'selenium', 'cypress', 'jest', 'pytest', 'junit', 'testng', 'playwright',

    # Version control / tools
    'git', 'github', 'gitlab', 'bitbucket',

    # Soft skills
    'leadership', 'communication', 'teamwork', 'problem solving',
    'project management', 'agile', 'scrum', 'kanban', 'time management',
    'presentation', 'critical thinking', 'adaptability', 'collaboration',

    # Design
    'figma', 'adobe xd', 'photoshop', 'illustrator', 'ui/ux', 'ux design',

    # Security
    'cybersecurity', 'penetration testing', 'ethical hacking', 'kali linux',
    'burp suite', 'wireshark',

    # Other common
    'sap', 'salesforce', 'servicenow', 'blockchain', 'solidity', 'web3',
]

# Skills that are usually tools, not real skills — filter them out
UNWANTED = {
    'git', 'github', 'jupyter', 'vscode', 'pycharm', 'intellij', 'eclipse',
    'postman', 'swagger', 'jira', 'confluence', 'slack', 'teams', 'outlook',
    'word', 'powerpoint', 'excel', 'notion', 'trello', 'asana',
}


# ============ SECTION HEADERS ============

SECTION_PATTERNS = {
    'summary':        r'^(summary|objective|profile|about\s*me|professional\s*summary|career\s*objective)\s*:?\s*$',
    'education':      r'^(education|academic\s*background|academics|qualifications|educational\s*qualifications)\s*:?\s*$',
    'experience':     r'^(experience|work\s*experience|professional\s*experience|employment|work\s*history|internships?)\s*:?\s*$',
    'skills':         r'^(skills|technical\s*skills|core\s*competencies|key\s*skills|technologies)\s*:?\s*$',
    'projects':       r'^(projects|academic\s*projects|personal\s*projects|key\s*projects)\s*:?\s*$',
    'certifications': r'^(certifications?|licenses?|courses?|training|achievements?|awards?)\s*:?\s*$',
    'languages':      r'^(languages?\s*known|languages?)\s*:?\s*$',
    'interests':      r'^(interests|hobbies|activities)\s*:?\s*$',
    'references':     r'^(references?)\s*:?\s*$',
    'declaration':    r'^(declaration)\s*:?\s*$',
}

SECTION_ORDER = ['summary', 'education', 'experience', 'skills', 'projects',
                 'certifications', 'languages', 'interests', 'references', 'declaration']


# ============ HELPERS ============

def extract_text_from_docx(file_content):
    """Extract raw text from a .docx file bytes."""
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
            tmp.write(file_content)
            tmp_path = tmp.name
        doc = Document(tmp_path)
        parts = [p.text for p in doc.paragraphs if p.text]

        # Also pull text from tables — resumes often use tables
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text and cell.text.strip():
                        parts.append(cell.text.strip())

        return '\n'.join(parts)
    except Exception as e:
        print(f"Error extracting DOCX text: {e}")
        return ""
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


def split_into_sections(text):
    """
    Return dict: { section_name: [lines...] }.
    Detects uppercase headers OR Title Case headers that match known section names.
    """
    lines = [ln.rstrip() for ln in text.split('\n')]
    sections = {name: [] for name in SECTION_ORDER}
    sections['_header'] = []  # everything before the first section header

    current = '_header'
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        matched = None
        for name, pattern in SECTION_PATTERNS.items():
            if re.match(pattern, stripped, re.IGNORECASE):
                matched = name
                break

        if matched:
            current = matched
            continue

        sections[current].append(line)

    return sections


def clean_lines(lines):
    return [ln.strip() for ln in lines if ln.strip()]


def first_nonempty(lines):
    for ln in lines:
        if ln.strip():
            return ln.strip()
    return None


# ============ FIELD EXTRACTORS ============

def extract_name(text, header_lines=None):
    """Try to find the candidate's name."""
    # Prefer the top of the document (header block before any section)
    lines = header_lines if header_lines else text.split('\n')
    for line in lines[:15]:
        line = line.strip()
        if not line or len(line) < 3 or len(line) > 60:
            continue
        if any(c.isdigit() for c in line):
            continue
        # Skip lines with @ (email), / (links), or section-like words
        skip = ['resume', 'curriculum', 'vitae', 'contact', 'phone', 'email',
                'address', 'objective', 'summary', 'profile', 'education',
                'experience', 'skills', 'projects', 'linkedin', 'github']
        if any(w in line.lower() for w in skip):
            continue
        # Names are usually 2-4 capitalized words
        words = line.split()
        if 1 <= len(words) <= 5:
            # Accept if mostly alphabetic
            if all(any(ch.isalpha() for ch in w) for w in words):
                # Reject if it looks like a URL or email
                if '@' in line or 'http' in line.lower():
                    continue
                return line
    return None


def extract_email(text):
    pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'
    matches = re.findall(pattern, text)
    return matches[0] if matches else None


def extract_phone(text):
    # Look for Indian / international formats
    patterns = [
        r'\+91[\s-]?\d{10}',
        r'\+91[\s-]?\d{5}[\s-]?\d{5}',
        r'\b[6-9]\d{9}\b',                       # Indian mobile
        r'\+?\d{1,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}',
        r'\(\d{3}\)\s?\d{3}[-.\s]?\d{4}',
    ]
    for pattern in patterns:
        matches = re.findall(pattern, text)
        for m in matches:
            digits = re.sub(r'\D', '', m)
            if 10 <= len(digits) <= 15:
                return m.strip()
    return None


def extract_location(text):
    """
    Attempt to find a location.
    Returns a short string like 'Pune, Maharashtra' or 'Bangalore' or None.
    """
    lines = text.split('\n')

    # 1) Look for a line that has a "Location:" / "Address:" label
    for line in lines[:40]:
        m = re.match(r'^\s*(location|address|city|based\s*in)\s*[:\-]\s*(.+)$',
                     line, re.IGNORECASE)
        if m:
            val = m.group(2).strip()
            if 2 <= len(val) <= 80:
                return val

    # 2) Look for a line with a recognizable Indian city
    CITIES = [
        'mumbai', 'pune', 'bangalore', 'bengaluru', 'hyderabad', 'chennai',
        'delhi', 'new delhi', 'noida', 'gurgaon', 'gurugram', 'kolkata',
        'ahmedabad', 'jaipur', 'indore', 'bhopal', 'lucknow', 'nagpur',
        'kochi', 'coimbatore', 'chandigarh', 'surat', 'vadodara', 'patna',
        'ranchi', 'bhubaneswar', 'visakhapatnam', 'vijayawada', 'mysore',
        'trivandrum', 'thiruvananthapuram', 'nashik', 'aurangabad',
    ]
    for line in lines[:40]:
        low = line.lower()
        for city in CITIES:
            if city in low:
                # Try to grab "City, State"
                m = re.search(r'([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)[,\s]+'
                              r'(?:Maharashtra|Karnataka|Telangana|Tamil\s*Nadu|'
                              r'Delhi|Gujarat|Rajasthan|Madhya\s*Pradesh|'
                              r'Uttar\s*Pradesh|West\s*Bengal|Kerala|Punjab|'
                              r'Haryana|Bihar|Odisha|Andhra\s*Pradesh|'
                              r'Goa|Assam|Jharkhand)', line)
                if m:
                    return m.group(0)
                return line.strip()[:80]

    return None


def extract_links(text):
    linkedin = None
    github = None
    portfolio = None

    linkedin_m = re.search(r'(https?://)?(www\.)?linkedin\.com/in/[\w\-]+/?', text, re.IGNORECASE)
    if linkedin_m:
        linkedin = linkedin_m.group(0)
        if not linkedin.startswith('http'):
            linkedin = 'https://' + linkedin

    github_m = re.search(r'(https?://)?(www\.)?github\.com/[\w\-]+/?', text, re.IGNORECASE)
    if github_m:
        github = github_m.group(0)
        if not github.startswith('http'):
            github = 'https://' + github

    # Portfolio: any other URL that isn't linkedin/github and looks like a personal site
    all_urls = re.findall(r'https?://[^\s\)\]\},]+', text)
    for url in all_urls:
        low = url.lower()
        if 'linkedin.com' in low or 'github.com' in low:
            continue
        if any(x in low for x in ['gmail', 'google.com/maps', 'wa.me', 'twitter.com',
                                   'facebook.com', 'instagram.com']):
            continue
        portfolio = url
        break

    return {'linkedin_url': linkedin, 'github_url': github, 'portfolio_url': portfolio}


def extract_summary(sections):
    lines = clean_lines(sections.get('summary', []))
    if not lines:
        return None
    # Take up to 4 lines / 500 chars
    summary = ' '.join(lines)[:600]
    return summary if summary else None


def extract_skills(sections, full_text):
    """Skills from the SKILLS section, plus a fallback scan of the entire resume."""
    found = set()
    skills_text = ' '.join(sections.get('skills', []))
    if not skills_text:
        # Try the header block as a fallback
        skills_text = ' '.join(sections.get('_header', []))

    haystack = (skills_text + ' ' + full_text).lower()

    for skill in SKILLS_LIST:
        if skill in UNWANTED:
            continue
        # Word-boundary-ish check so "java" doesn't match "javascript"
        pattern = r'(?<![a-z0-9])' + re.escape(skill) + r'(?![a-z0-9])'
        if re.search(pattern, haystack):
            found.add(skill)

    return sorted(found)


def extract_education(sections):
    """
    Returns a list of education entries as strings.
    Kept as text (your DB stores it as Text).
    """
    lines = clean_lines(sections.get('education', []))
    if not lines:
        return None
    return '\n'.join(lines[:15])


def extract_experience(sections):
    lines = clean_lines(sections.get('experience', []))
    if not lines:
        return None
    return '\n'.join(lines[:25])


def extract_projects(sections):
    lines = clean_lines(sections.get('projects', []))
    if not lines:
        return None
    return '\n'.join(lines[:25])


def extract_certifications(sections):
    lines = clean_lines(sections.get('certifications', []))
    if not lines:
        return None
    return '\n'.join(lines[:15])


def extract_year_of_passout(text):
    """Look for a graduation year like 2024, 2025, 2026 near education keywords."""
    # Look specifically in education-ish text
    edu_context_m = re.search(
        r'(?:b\.?tech|be|bca|bsc|b\.?sc|mca|m\.?tech|mba|bcom|b\.?com|ba|12th|10th)[^\n]{0,120}',
        text, re.IGNORECASE
    )
    haystack = edu_context_m.group(0) if edu_context_m else text

    years = re.findall(r'\b(20(?:2[0-9]|3[0-9]))\b', haystack)
    if years:
        # Return the latest (typically expected graduation)
        return max(years)
    return None


def extract_degree_and_branch(text):
    """Very light detection — good enough to store degree/branch as strings."""
    degree = None
    branch = None

    degree_map = {
        r'\bb\.?tech\b': 'B.Tech',
        r'\bbe\b': 'B.E.',
        r'\bbca\b': 'BCA',
        r'\bb\.?sc\b': 'B.Sc.',
        r'\bbcom\b|\bb\.?com\b': 'B.Com',
        r'\bbba\b': 'BBA',
        r'\bmca\b': 'MCA',
        r'\bm\.?tech\b': 'M.Tech',
        r'\bmba\b': 'MBA',
        r'\bm\.?sc\b': 'M.Sc.',
        r'\bphd\b|\bph\.?d\b': 'PhD',
    }
    for pattern, label in degree_map.items():
        if re.search(pattern, text, re.IGNORECASE):
            degree = label
            break

    branch_map = {
        r'computer science|\bcse\b': 'Computer Science',
        r'information technology|\bit\b': 'Information Technology',
        r'electronics|\bece\b|\be&tc\b': 'Electronics',
        r'mechanical': 'Mechanical',
        r'civil': 'Civil',
        r'electrical|\beee\b': 'Electrical',
        r'commerce': 'Commerce',
        r'management|\bmba\b': 'Management',
        r'data science': 'Data Science',
    }
    for pattern, label in branch_map.items():
        if re.search(pattern, text, re.IGNORECASE):
            branch = label
            break

    return degree, branch


# ============ MAIN ENTRY ============

def parse_resume(text, file_content=None, filename=None):
    """
    Parse a resume text and return a dict with everything the app needs.

    Returns keys:
        name, email, phone, location, year_of_passout, degree, branch,
        experience, education, about, linkedin_url, github_url, portfolio_url,
        skills (list), courses (str), certifications (str), projects (str),
        role
    """
    if filename and filename.lower().endswith('.docx'):
        text = extract_text_from_docx(file_content) if file_content else text

    if not text:
        return _empty_result()

    sections = split_into_sections(text)
    header_lines = sections.get('_header', [])

    links = extract_links(text)
    degree, branch = extract_degree_and_branch(text)

    result = {
        'name': extract_name(text, header_lines),
        'email': extract_email(text),
        'phone': extract_phone(text),
        'location': extract_location(text),
        'year_of_passout': extract_year_of_passout(text),
        'degree': degree,
        'branch': branch,

        'about': extract_summary(sections),
        'education': extract_education(sections),
        'experience': extract_experience(sections),
        'projects': extract_projects(sections),
        'certifications': extract_certifications(sections),

        'linkedin_url': links['linkedin_url'],
        'github_url': links['github_url'],
        'portfolio_url': links['portfolio_url'],

        'skills': extract_skills(sections, text),

        # Stored as strings in DB; courses are the same as certifications in most resumes
        'courses': None,
        'role': 'student',
    }

    # Infer role from experience
    if result['experience']:
        exp_low = result['experience'].lower()
        if any(k in exp_low for k in ['internship', 'intern ']):
            result['role'] = 'student'
        elif any(k in exp_low for k in ['years of experience', 'year experience',
                                        'senior', 'lead', 'manager']):
            result['role'] = 'experienced'
        else:
            result['role'] = 'fresher'

    return result


def _empty_result():
    return {
        'name': None, 'email': None, 'phone': None, 'location': None,
        'year_of_passout': None, 'degree': None, 'branch': None,
        'about': None, 'education': None, 'experience': None,
        'projects': None, 'certifications': None, 'courses': None,
        'linkedin_url': None, 'github_url': None, 'portfolio_url': None,
        'skills': [], 'role': 'student',
    }