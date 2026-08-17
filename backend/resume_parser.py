import re

# ====== SKILLS LIST ======
SKILLS_LIST = [
    'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby',
    'react', 'angular', 'vue', 'django', 'flask', 'spring', 'node', 'express',
    'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'docker', 'kubernetes',
    'aws', 'azure', 'gcp', 'git', 'linux', 'html', 'css', 'machine learning',
    'deep learning', 'nlp', 'data science', 'pandas', 'numpy', 'scikit-learn',
    'tensorflow', 'pytorch', 'keras', 'tableau', 'power bi', 'excel',
    'rest api', 'graphql', 'microservices', 'leadership', 'communication',
    'teamwork', 'project management', 'agile', 'scrum', 'matplotlib',
    'seaborn', 'plotly', 'streamlit', 'opencv', 'flask', 'fastapi'
]

UNWANTED = [
    'git', 'github', 'jupyter', 'vscode', 'pycharm', 'intellij', 'eclipse',
    'postman', 'swagger', 'jira', 'confluence', 'slack', 'teams', 'outlook',
    'word', 'powerpoint', 'excel'
]

def extract_name(text):
    lines = text.split('\n')
    for line in lines[:20]:
        line = line.strip()
        if not line:
            continue
        skip_words = ['resume', 'curriculum', 'vitae', 'contact', 'phone', 
                     'email', 'address', 'objective', 'summary', 'profile',
                     'education', 'experience', 'skills', 'projects']
        if any(word in line.lower() for word in skip_words):
            continue
        words = line.split()
        if 2 <= len(words) <= 4:
            if all(word[0].isupper() and word.isalpha() for word in words):
                return line
    return None

def extract_email(text):
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    return emails[0] if emails else None

def extract_phone(text):
    phone_patterns = [
        r'\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}',
        r'\d{10}',
        r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}',
        r'\(\d{3}\)\s?\d{3}[-.\s]?\d{4}'
    ]
    for pattern in phone_patterns:
        matches = re.findall(pattern, text)
        if matches:
            for match in matches:
                if len(re.sub(r'\D', '', match)) >= 10:
                    return match
    return None

def extract_skills_from_section(text):
    """Extract skills from SKILLS section"""
    found_skills = set()
    
    # Get SKILLS section
    skills_text = ""
    lines = text.split('\n')
    in_skills = False
    
    for line in lines:
        line_stripped = line.strip()
        if re.search(r'^SKILLS\s*$|^TECHNICAL SKILLS\s*$', line_stripped, re.IGNORECASE):
            in_skills = True
            continue
        if in_skills:
            if re.search(r'^[A-Z][A-Z\s]+$', line_stripped) and len(line_stripped) > 5:
                break
            if line_stripped and not line_stripped.startswith('-'):
                skills_text += line_stripped + " "
    
    if not skills_text:
        pattern = r'SKILLS\s*\n([\s\S]*?)(?=\n[A-Z][A-Z\s]+:|$)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            skills_text = match.group(1)
    
   # print(f"📝 Skills text found: {skills_text[:200]}...")
    
    if skills_text:
        skills_text_lower = skills_text.lower()
        
        # Method 1: Direct skill matching
        for skill in SKILLS_LIST:
            if skill in skills_text_lower:
                if skill not in UNWANTED:
                    found_skills.add(skill)
                   # print(f"✅ Found skill: {skill}")
        
        # Method 2: Extract from colon-separated lists
        colon_pattern = r'([A-Za-z\s]+):\s*([^,\n]+(?:,\s*[^,\n]+)*)'
        matches = re.findall(colon_pattern, skills_text, re.IGNORECASE)
        for match in matches:
            skills_part = match[1].strip()
            items = re.split(r'[,;•\n]', skills_part)
            for item in items:
                item = item.strip().lower()
                if item in SKILLS_LIST and item not in UNWANTED:
                    found_skills.add(item)
                   # print(f"✅ Found skill from colon list: {item}")
        
        # Method 3: Extract from comma-separated lists
        for line in skills_text.split('\n'):
            line = line.strip()
            if ':' in line:
                continue
            items = re.split(r'[,;•\n]', line)
            for item in items:
                item = item.strip().lower()
                if item in SKILLS_LIST and item not in UNWANTED:
                    found_skills.add(item)
                    #print(f"✅ Found skill from comma list: {item}")
    
    return list(found_skills)

def parse_resume(text):
    """Main function to parse resume"""
    all_skills = extract_skills_from_section(text)
    
    
    return {
        'name': extract_name(text),
        'email': extract_email(text),
        'phone': extract_phone(text),
        'skills': all_skills
    }