import os
import shutil
import glob
import re

base_dir = '/Volumes/Work/untitled folder/backend/app'

# Create directories
modules = ['core', 'attrition_module', 'resume_module', 'matching_module', 'interview_module']
for mod in modules:
    os.makedirs(os.path.join(base_dir, mod), exist_ok=True)
    with open(os.path.join(base_dir, mod, '__init__.py'), 'w') as f:
        pass

# File mapping
file_moves = {
    'utils.py': 'core',
    'schemas.py': 'core',
    'model_loader.py': 'core',
    'ats_store.py': 'core',
    'cv_cache.py': 'core',
    'hiring_cycle.py': 'core',
    'hiring_cycle_schemas.py': 'core',
    'predictor.py': 'attrition_module',
    'cv_parser.py': 'resume_module',
    'credential_validator.py': 'resume_module',
    'resume_explainer_model.py': 'resume_module',
    'matching_engine.py': 'matching_module',
    'interview_scorer.py': 'interview_module',
}

# Move files
for file, mod in file_moves.items():
    src = os.path.join(base_dir, file)
    dst = os.path.join(base_dir, mod, file)
    if os.path.exists(src):
        shutil.move(src, dst)

# Prepare import replacement rules
import_replacements = {}
for file, mod in file_moves.items():
    module_name = file.replace('.py', '')
    import_replacements[f'app.{module_name}'] = f'app.{mod}.{module_name}'
    # Also handle from app import module
    import_replacements[f'from app import {module_name}'] = f'from app.{mod} import {module_name}'
    # Also handle from app.module import
    import_replacements[f'from app.{module_name} import'] = f'from app.{mod}.{module_name} import'

# Find all python files in app/
py_files = []
for root, dirs, files in os.walk(base_dir):
    if '__pycache__' in dirs:
        dirs.remove('__pycache__')
    for f in files:
        if f.endswith('.py'):
            py_files.append(os.path.join(root, f))

# Apply replacements
for py_file in py_files:
    with open(py_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in import_replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(py_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
print("Backend refactored successfully.")
