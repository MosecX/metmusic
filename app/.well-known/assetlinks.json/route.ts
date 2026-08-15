export const GET = () =>
  new Response(
    JSON.stringify([
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "com.metmusic.app",
          sha256_cert_fingerprints: ["7/FrqHC/LumCavqAHDPUSZ+p0dVbh7h2+HEN8sIeNhA="],
        },
      },
    ]),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
      },
    }
  );