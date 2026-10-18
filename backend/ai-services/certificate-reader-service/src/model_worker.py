import multiprocessing
import threading
from config import TIMEOUT

def worker_loop(connection):
    from contracts import ReadInput
    from model_reader import read_certificate
    while True:
        try:
            message = connection.recv()
        except EOFError:
            return
        if message is None:
            return
        payload, request_id = message
        try:
            result = read_certificate(ReadInput.model_validate(payload), request_id)
            connection.send({"data": result})
        except ValueError:
            connection.send({"error": "The certificate image or PDF could not be decoded safely.", "status": 422})
        except Exception:
            connection.send({"error": "The local certificate reader is unavailable. Check its models and dependencies.", "status": 503})

class ModelWorker:
    def __init__(self):
        self.process = None
        self.connection = None
        self.lock = threading.Lock()

    def close(self):
        if self.connection:
            self.connection.close()
            self.connection = None
        if self.process and self.process.pid:
            self.process.terminate()
            self.process.join(timeout=2)
            self.process = None

    def read(self, payload, request_id):
        if not self.lock.acquire(timeout=TIMEOUT):
            return {"error": "The local certificate reader is busy.", "status": 429}
        try:
            if not self.process or not self.process.is_alive():
                self.close()
                context = multiprocessing.get_context("spawn")
                self.connection, child = context.Pipe()
                self.process = context.Process(target=worker_loop, args=(child,), daemon=True)
                self.process.start()
                child.close()
            self.connection.send((payload.model_dump(), request_id))
            if not self.connection.poll(TIMEOUT):
                self.close()
                return {"error": "Local OCR or vision reading timed out. Try fewer images or a smaller local model.", "status": 504}
            return self.connection.recv()
        except (EOFError, BrokenPipeError, OSError):
            self.close()
            return {"error": "The local inference worker stopped unexpectedly.", "status": 503}
        finally:
            self.lock.release()

worker = ModelWorker()
