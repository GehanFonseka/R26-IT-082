import os
import shutil

BASE_DIR = '/Volumes/Work/untitled folder/ta/src'
PAGES_DIR = os.path.join(BASE_DIR, 'pages')
MODULES_DIR = os.path.join(BASE_DIR, 'modules')

# Create modules structure
modules = {
    'resume': ['ResumeParserPage.jsx', 'CandidateWorkspacePage.jsx'],
    'matching': ['HrPostJobsPage.jsx', 'HrCandidatesPage.jsx', 'HrWorkspacePage.jsx', 'FullHiringCyclePage.jsx'],
    'interview': ['InterviewSoftSkillPage.jsx'],
    'attrition': ['BiasDetectionPage.jsx', 'RecruitmentAnalyticsPage.jsx', 'HrCandidateReviewPage.jsx'],
    'core': ['LandingPage.jsx', 'PortalLoginPage.jsx', 'NotFoundPage.jsx', 'ModulePlaceholderPage.jsx']
}

for mod, files in modules.items():
    mod_dir = os.path.join(MODULES_DIR, mod)
    os.makedirs(mod_dir, exist_ok=True)
    
    for f in files:
        src = os.path.join(PAGES_DIR, f)
        dest = os.path.join(mod_dir, f)
        if os.path.exists(src):
            shutil.move(src, dest)
            print(f"Moved {f} to {mod}/")

# Update imports inside the moved files
for mod, files in modules.items():
    mod_dir = os.path.join(MODULES_DIR, mod)
    for f in files:
        filepath = os.path.join(mod_dir, f)
        if os.path.exists(filepath):
            with open(filepath, 'r') as file:
                content = file.read()
            
            # Update relative imports
            content = content.replace("from '../components", "from '../../components")
            content = content.replace("from '../context", "from '../../context")
            content = content.replace("from '../utils", "from '../../utils")
            content = content.replace("from '../data", "from '../../data")
            
            with open(filepath, 'w') as file:
                file.write(content)

# Update App.jsx imports
app_path = os.path.join(BASE_DIR, 'App.jsx')
if os.path.exists(app_path):
    with open(app_path, 'r') as file:
        content = file.read()
    
    content = content.replace("from './pages/CandidateWorkspacePage'", "from './modules/resume/CandidateWorkspacePage'")
    content = content.replace("from './pages/HrCandidateReviewPage'", "from './modules/attrition/HrCandidateReviewPage'")
    content = content.replace("from './pages/HrWorkspacePage'", "from './modules/matching/HrWorkspacePage'")
    content = content.replace("from './pages/PortalLoginPage'", "from './modules/core/PortalLoginPage'")
    content = content.replace("from './pages/NotFoundPage'", "from './modules/core/NotFoundPage'")
    
    with open(app_path, 'w') as file:
        file.write(content)

# Clean up empty pages directory
try:
    os.rmdir(PAGES_DIR)
    print("Removed empty pages directory.")
except OSError:
    print("Pages directory not empty, could not remove.")
