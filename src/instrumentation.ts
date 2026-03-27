/**
 * Next.js Instrumentation — runs once on server startup.
 * Registers a node-cron job to sync the Google Slides workout plan
 * every day at 5:00 AM server local time.
 */
export async function register() {
  // Only run in the Node.js runtime (not Edge), and only on the server
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const cron = await import("node-cron");

  cron.schedule("0 5 * * *", async () => {
    console.log("[cron] Starting daily workout sync at", new Date().toISOString());
    try {
      const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3000}`;
      const res = await fetch(`${baseUrl}/api/sync`, { method: "POST" });
      const data = await res.json();
      console.log("[cron] Sync complete:", data);
    } catch (err) {
      console.error("[cron] Sync failed:", err);
    }
  });

  console.log("[cron] Daily sync scheduled for 5:00 AM");
}
