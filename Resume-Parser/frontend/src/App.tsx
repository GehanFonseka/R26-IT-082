import { Routes, Route, Link } from "react-router-dom";
import ResumeUpload from "./ResumeUpload";
import CandidateList from "./CandidateList";
import CandidateProfile from "./CandidateProfile";
import "./App.css";

function App() {
  return (
    <div>
      <h1>Resume Parser System</h1>

      <nav style={{ marginBottom: "20px" }}>
        <Link to="/" style={{ marginRight: "10px" }}>
          Upload
        </Link>
        <Link to="/candidates">Candidates</Link>
      </nav>

      <Routes>
        <Route path="/" element={<ResumeUpload />} />
        <Route path="/candidates" element={<CandidateList />} />
        <Route path="/candidates/:id" element={<CandidateProfile />} />
      </Routes>
    </div>
  );
}

export default App;