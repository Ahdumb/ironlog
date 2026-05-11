import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL || "admin@peakset.app"}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const MESSAGES = [
  "Time to hit a lift 💪",
  "The gym is calling 🏋️",
  "Don't skip today's session!",
  "Your streak is waiting 🔥",
  "Get after it today 💪",
  "No days off — let's go 🔥",
];

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end("Unauthorized");
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const currentHour = new Date().getUTCHours();

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("reminder_hour", currentHour);

  if (error) {
    console.error("push_subscriptions fetch failed:", error);
    return res.status(500).json({ error: "db_error" });
  }

  let sent = 0;
  const staleIds = [];

  await Promise.allSettled(
    (subs || []).map(async sub => {
      try {
        await webpush.sendNotification(
          JSON.parse(sub.subscription),
          JSON.stringify({
            title: "PeakSet",
            body: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
          })
        );
        sent++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          staleIds.push(sub.id);
        } else {
          console.error("push send failed:", err.statusCode, err.body);
        }
      }
    })
  );

  if (staleIds.length) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
  }

  res.json({ sent, stale: staleIds.length });
}
