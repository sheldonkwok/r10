import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import { AdminPage } from "./components/AdminPage.tsx";

const isAdmin = window.location.pathname === "/admin";

// biome-ignore lint/style/noNonNullAssertion: Vite guarantees #root exists
createRoot(document.getElementById("root")!).render(isAdmin ? <AdminPage /> : <App />);
