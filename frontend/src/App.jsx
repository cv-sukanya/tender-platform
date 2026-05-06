import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import TenderDetails from "./pages/TenderDetails";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tender/:id" element={<TenderDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;