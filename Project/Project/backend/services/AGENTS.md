# Business service instructions

Each service owns one recruitment domain and can be deployed on its own.

- Keep routes/controllers, validation, orchestration services, and repositories
  separate.
- Repositories are interfaces or service-owned implementations; never import a
  repository from another service.
- Resume, matching, interview, and attrition services call their corresponding
  model service. They must not embed model or inference code.
- Validate request input before orchestration and return the common error shape.
- Preserve `x-request-id` in downstream calls and safe structured logs.
- Do not return fake domain data. A missing database or model integration should
  return a descriptive 501/503 response.
- Keep every authored source file under 150 lines.
