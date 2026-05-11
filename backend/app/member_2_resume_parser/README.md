# Member 2: Resume Parsing Module

- Notebook: `../../../models/02_resume_parser_model_training.ipynb`
- API routes: `routes.py`
- Model logic: `cv_parser.py`, `resume_explainer_model.py`, `credential_validator.py`
- Endpoints: `/api/v1/cv-cache/upload`, `/api/v1/cv-cache/{cv_cache_id}/text`

This member owns CV text extraction, resume parsing, credential validation, and CV-derived feature inference.
