import axios from "axios";
import { useState } from "react";

export default function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/upload",
        formData
      );
      setResult(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Upload Resume</h2>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button onClick={handleUpload}>Upload</button>

      {result && (
        <pre>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}