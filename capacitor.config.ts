import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.metmusic.app",
  appName: "MetMusic",
  webDir: "web",
  server: {
    url: "https://metmusic.qzz.io/",
  },
};

export default config;