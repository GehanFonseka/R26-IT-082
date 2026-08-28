from pathlib import Path
import os

from dotenv import load_dotenv


SERVICE_NAME = "speech-to-text-service"
SERVICE_DIRECTORY = Path(__file__).resolve().parents[1]
load_dotenv(SERVICE_DIRECTORY / ".env")

PORT = int(os.getenv("PORT", "4005"))
MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "small.en")
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8" if DEVICE == "cpu" else "float16")
MODEL_PATH = Path(os.getenv("WHISPER_MODEL_PATH") or SERVICE_DIRECTORY / "model" / MODEL_SIZE).resolve()
BEAM_SIZE = int(os.getenv("WHISPER_BEAM_SIZE", "5"))
MAX_AUDIO_BYTES = int(os.getenv("MAX_AUDIO_BYTES", str(5 * 1024 * 1024)))
DEFAULT_INITIAL_PROMPT = "English technical job interview. Preserve technical terms, acronyms, product names, programming languages, frameworks, cloud services, databases, and software engineering vocabulary."
DEFAULT_HOTWORDS = (
    "OOP, object-oriented programming, encapsulation, inheritance, polymorphism, abstraction, SOLID, "
    "design patterns, class, object, interface, constructor, method, function, recursion, data structures, "
    "algorithms, Big O, time complexity, space complexity, JavaScript, TypeScript, Python, Java, C sharp, "
    "C plus plus, Go, Rust, PHP, Ruby, Kotlin, Swift, SQL, HTML, CSS, React, Angular, Vue, Node.js, "
    "Express, Next.js, Django, Flask, Spring Boot, .NET, REST API, GraphQL, gRPC, JSON, XML, WebSocket, "
    "HTTP, HTTPS, OAuth, JWT, authentication, authorization, encryption, hashing, MySQL, PostgreSQL, "
    "MongoDB, Redis, Elasticsearch, database normalization, indexing, joins, transactions, ACID, Docker, "
    "Kubernetes, Terraform, Jenkins, GitHub Actions, CI/CD, microservices, serverless, AWS, Azure, GCP, "
    "Lambda, S3, EC2, Git, GitHub, GitLab, Agile, Scrum, unit testing, integration testing, end-to-end testing, "
    "Jest, Cypress, Selenium, Postman, operating system, process, thread, concurrency, deadlock, TCP/IP, DNS, "
    "machine learning, deep learning, NLP, neural network, regression, classification, TensorFlow, PyTorch, "
    "pandas, NumPy, API, SDK, UI, UX, frontend, backend, full stack, DevOps, SRE, scalability, latency"
)
INITIAL_PROMPT = os.getenv("WHISPER_INITIAL_PROMPT") or DEFAULT_INITIAL_PROMPT
HOTWORDS = os.getenv("WHISPER_HOTWORDS") or DEFAULT_HOTWORDS
