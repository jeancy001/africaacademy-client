const isLocal = true; // or false

export const API_URL = isLocal
  ? "http://localhost:5000/api/v1"
  : "https://africaacademy-server.onrender.com/api/v1";
