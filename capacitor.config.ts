import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.metmusic.app",
  appName: "MetMusic",
  webDir: "web",
  server: {
    url: "https://metmusic.moisessampson020110.workers.dev/",
  },
};

export default config;