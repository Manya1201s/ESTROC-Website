import { Navigate, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* The host rewrites unknown paths to index.html, so without this catch-all a
          stray URL would mount the router with nothing to render — a blank page. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
