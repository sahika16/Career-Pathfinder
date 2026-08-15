import re

# ====== CORE SKILLS FOR TESTING ======
CORE_SKILLS = {
    # Programming Languages
    'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 
    'go', 'rust', 'swift', 'kotlin', 'php', 'scala', 'perl', 'r', 'matlab',
    'dart', 'groovy', 'lua', 'haskell', 'clojure', 'elixir', 'erlang',
    
    # Web Frameworks
    'react', 'angular', 'vue', 'django', 'flask', 'spring', 'node', 'express',
    'rails', 'laravel', 'next.js', 'gatsby', 'nuxt', 'svelte', 'asp.net',
    'fastapi', 'gin', 'echo', 'play framework', 'dropwizard', 'micronaut',
    
    # Databases
    'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'cassandra',
    'elasticsearch', 'dynamodb', 'firebase', 'oracle', 'mssql', 'sqlite',
    'neo4j', 'influxdb', 'couchdb', 'riak', 'hbase',
    
    # Cloud & DevOps
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ansible',
    'jenkins', 'gitlab ci', 'github actions', 'circleci', 'travis ci',
    'prometheus', 'grafana', 'elk stack', 'splunk', 'datadog', 'new relic',
    'nginx', 'apache', 'linux', 'unix', 'bash', 'powershell',
    
    # Data Science & ML
    'machine learning', 'deep learning', 'nlp', 'computer vision',
    'data science', 'pandas', 'numpy', 'scikit-learn', 'tensorflow',
    'pytorch', 'keras', 'opencv', 'spark', 'hadoop', 'airflow',
    'mlflow', 'dvc', 'kubeflow', 'transformers', 'langchain',
    
    # Frontend
    'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind', 'material ui',
    'chakra ui', 'ant design', 'styled components', 'webpack', 'vite',
    'rollup', 'parcel', 'babel', 'eslint', 'prettier',
    
    # Backend & APIs
    'rest api', 'graphql', 'microservices', 'websocket', 'oauth', 'jwt',
    'grpc', 'soap', 'kafka', 'rabbitmq', 'api gateway', 'service mesh',
    
    # Testing
    'unit testing', 'integration testing', 'e2e testing', 'selenium',
    'junit', 'pytest', 'jest', 'mocha', 'cypress', 'playwright',
    'testcafe', 'karate', 'postman', 'soapui', 'jmeter',
    
    # Mobile
    'android', 'ios', 'flutter', 'react native', 'swift ui', 'kotlin multi',
    'xamarin', 'cordova', 'ionic', 'native script',
    
    # Game Development
    'unity', 'unreal', 'godot', 'cocos2d', 'photon', 'playfab'
}

# ====== CONCEPT SKILLS (Will have common test) ======
CONCEPT_SKILLS = {
    'data structures', 'algorithms', 'object-oriented programming',
    'oop', 'dbms', 'computer networks', 'operating systems',
    'system design', 'software engineering', 'design patterns',
    'compiler design', 'computer architecture', 'cryptography',
    'network security', 'cyber security', 'cloud computing',
    'parallel computing', 'distributed systems', 'machine learning concepts'
}

# ====== SKILLS TO COMPLETELY REMOVE ======
UNWANTED_SKILLS = {
    # Tools
    'git', 'github', 'jupyter', 'excel', 'powerpoint', 'word', 'outlook',
    'vscode', 'pycharm', 'intellij', 'eclipse', 'notepad++', 'sublime text',
    'postman', 'insomnia', 'swagger', 'tableau', 'power bi', 'looker',
    'jira', 'confluence', 'slack', 'teams', 'trello', 'asana', 'notion',
    
    # Soft Skills
    'communication', 'leadership', 'teamwork', 'project management',
    'agile', 'scrum', 'kanban', 'waterfall', 'prince2', 'pmp',
    'problem solving', 'critical thinking', 'public speaking',
    'presentation', 'writing', 'negotiation', 'mentoring',
    
    # File/Data Formats
    'file handling', 'xml', 'json', 'yaml', 'csv', 'toml',
    
    # Miscellaneous
    'linux', 'bash', 'powershell', 'unix', 'vim', 'emacs',
    'windows', 'macos', 'ios development', 'android development'
}

# ====== SKILLS FOR CONCEPT TEST ======
CONCEPT_TEST_SKILLS = {
    'data structures': 'Data Structures',
    'algorithms': 'Algorithms',
    'object-oriented programming': 'OOP',
    'oop': 'OOP',
    'dbms': 'DBMS',
    'computer networks': 'Computer Networks',
    'operating systems': 'Operating Systems',
    'system design': 'System Design',
    'software engineering': 'Software Engineering',
    'design patterns': 'Design Patterns'
}

def filter_skills(raw_skills):
    """Filter skills - remove unwanted, keep core, separate concepts"""
    if not raw_skills:
        return [], []
    
    core_found = set()
    concept_found = set()
    
    for skill in raw_skills:
        skill_lower = skill.lower().strip()
        
        # Skip unwanted
        if skill_lower in UNWANTED_SKILLS:
            continue
        
        # Check if it's a concept skill
        if skill_lower in CONCEPT_SKILLS or skill_lower in CONCEPT_TEST_SKILLS:
            concept_found.add(skill_lower)
            continue
        
        # Check if it's a core skill
        if skill_lower in CORE_SKILLS:
            core_found.add(skill_lower)
            # Also check for partial matches (e.g., "reactjs" should match "react")
            for core in CORE_SKILLS:
                if core in skill_lower and len(core) > 2:
                    core_found.add(core)
    
    return list(core_found), list(concept_found)

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
        r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}',
        r'\(\d{3}\)\s?\d{3}[-.\s]?\d{4}',
        r'\+\d{1,3}\s?\d{10}',
        r'\d{10}'
    ]
    for pattern in phone_patterns:
        matches = re.findall(pattern, text)
        if matches:
            for match in matches:
                if len(match.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')) >= 10:
                    return match
    return None

def extract_skills_from_section(text):
    lines = text.split('\n')
    in_skills_section = False
    skills_text = []
    
    for line in lines:
        line_stripped = line.strip()
        if re.search(r'^SKILLS\s*$|^TECHNICAL SKILLS\s*$', line_stripped, re.IGNORECASE):
            in_skills_section = True
            continue
        if in_skills_section:
            if re.search(r'^[A-Z][A-Z\s]+$', line_stripped) and len(line_stripped) > 5:
                if line_stripped not in ['PROGRAMMING LANGUAGES:', 'PYTHON CONCEPTS:', 'LIBRARIES:', 'DATABASE:', 'TOOLS & PLATFORMS:']:
                    break
            if line_stripped and not line_stripped.startswith('-'):
                skills_text.append(line_stripped)
    
    skills_section = ' '.join(skills_text)
    
    if not skills_section:
        skills_pattern = r'SKILLS\s*\n([\s\S]*?)(?=\n[A-Z][A-Z\s]+:)'
        match = re.search(skills_pattern, text, re.IGNORECASE)
        if match:
            skills_section = match.group(1)
    
    if skills_section:
        skills_section_lower = skills_section.lower()
        found_skills = set()
        
        # Check each core skill
        for skill in CORE_SKILLS:
            if skill in skills_section_lower:
                if skill == 'go' and 'golang' not in skills_section_lower:
                    continue
                found_skills.add(skill)
        
        # Check for concept skills
        for skill in CONCEPT_TEST_SKILLS:
            if skill in skills_section_lower:
                found_skills.add(skill)
        
        return list(found_skills)
    
    return []

def parse_resume(text):
    raw_skills = extract_skills_from_section(text)
    core_skills, concept_skills = filter_skills(raw_skills)
    
    # Combine both types for database storage
    all_skills = core_skills + concept_skills
    
    return {
        'name': extract_name(text),
        'email': extract_email(text),
        'phone': extract_phone(text),
        'skills': all_skills,
        'core_skills': core_skills,
        'concept_skills': concept_skills
    }