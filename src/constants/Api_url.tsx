const isLocal = false; // or false

export const API_URL = isLocal
  ? "http://localhost:5000/api/v1"
  : "https://africaacademy-server.vercel.app/api/v1";
