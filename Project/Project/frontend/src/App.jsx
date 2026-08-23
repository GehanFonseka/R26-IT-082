import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import "./App.css";

function App() {
  return (
    <AuthProvider><BrowserRouter><div className="app-shell"><AppRoutes /></div></BrowserRouter></AuthProvider>
  );
}

export default App;
