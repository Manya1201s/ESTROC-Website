import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* A stray URL lands on a page that says so, rather than being bounced to
          the homepage as though nothing happened. */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
