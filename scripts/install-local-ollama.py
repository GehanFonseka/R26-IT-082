import io
import os
import sys
import subprocess
import zipfile
from pathlib import Path
import httpx

URL = os.getenv("OLLAMA_WINDOWS_ARCHIVE_URL", "https://github.com/ollama/ollama/releases/download/v0.40.3/ollama-windows-amd64.zip")
ROOT = Path(__file__).resolve().parents[1] / ".local-ai" / "ollama"

class RemoteArchive(io.RawIOBase):
    def __init__(self, client):
        self.client = client
        response = client.head(URL, follow_redirects=True)
        response.raise_for_status()
        self.url = str(response.url)
        self.size = int(response.headers["content-length"])
        self.offset = 0
        self.cache = {}

    def seekable(self):
        return True

    def tell(self):
        return self.offset

    def seek(self, offset, whence=0):
        self.offset = offset if whence == 0 else self.offset + offset if whence == 1 else self.size + offset
        return self.offset

    def read(self, size=-1):
        end = self.size if size < 0 else min(self.size, self.offset + size)
        if end <= self.offset:
            return b""
        chunks = []
        while self.offset < end:
            start = self.offset // 1048576 * 1048576
            if start not in self.cache:
                stop = min(self.size, start + 1048576)
                response = subprocess.run(["curl.exe" if os.name == "nt" else "curl", "--silent", "--show-error",
                    "--fail", "--location", "--range", f"{start}-{stop - 1}", "--max-time", "45", "--retry", "2", self.url],
                    capture_output=True, check=True, timeout=150)
                if len(response.stdout) != stop - start:
                    raise RuntimeError("The official archive server did not return the requested range.")
                if len(self.cache) >= 4:
                    self.cache.pop(next(iter(self.cache)))
                self.cache[start] = response.stdout
            chunk = self.cache[start][self.offset - start:min(end - start, 1048576)]
            if not chunk:
                raise RuntimeError("The archive download was incomplete.")
            chunks.append(chunk)
            self.offset += len(chunk)
        return b"".join(chunks)

def cpu_file(name):
    lowered = name.lower().replace("\\", "/")
    return lowered.endswith((".exe", ".dll")) and not any(part in lowered for part in
        ("cuda", "cublas", "cudart", "nvrtc", "nvml", "vulkan", "rocm", "hipblas", "rocblas"))

def main():
    with httpx.Client(timeout=180, follow_redirects=True, trust_env=False,
                      transport=httpx.HTTPTransport(retries=3)) as client:
        with zipfile.ZipFile(RemoteArchive(client)) as archive:
            selected = [item for item in archive.infolist() if cpu_file(item.filename)]
            if "--list" in sys.argv:
                for item in selected:
                    print(f"{item.filename}: {item.file_size} bytes")
                return
            ROOT.mkdir(parents=True, exist_ok=True)
            for item in selected:
                destination = (ROOT / item.filename).resolve()
                if not destination.is_relative_to(ROOT.resolve()):
                    raise RuntimeError("Invalid archive path.")
                destination.parent.mkdir(parents=True, exist_ok=True)
                if destination.exists() and destination.stat().st_size == item.file_size:
                    continue
                print(f"Installing {item.filename}", flush=True)
                with archive.open(item) as source, destination.open("wb") as output:
                    while chunk := source.read(1024 * 1024):
                        output.write(chunk)
    print(f"Portable CPU Ollama installed in {ROOT}", flush=True)

if __name__ == "__main__":
    main()
