import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Change repositoryName to your GitHub repository when deploying to Pages.
const repositoryName = "RU-HARDLE";

export default defineConfig({
  plugins: [react()],
  base: repositoryName ? `/${repositoryName}/` : "/",
});
