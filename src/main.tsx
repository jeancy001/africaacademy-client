// index.tsx
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/* ===================== QUERY CLIENT ===================== */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000,       // ⚡ fast UI (cache)
      retry: 1,              // retry once on failure
      // refetchInterval: 10000, // 🔄 uncomment if you want global auto-refresh
    },
  },
});

/* ===================== RENDER ===================== */
const container = document.getElementById("root");
if (!container) throw new Error("Root container not found");

createRoot(container).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);
