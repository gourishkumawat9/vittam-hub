import preset from "@vittamhub/tokens/tailwind-preset";
import type { Config } from "tailwindcss";

const config: Config = {
  presets: [preset as Config],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
