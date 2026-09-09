// Runs on a schedule (see supabase/migrations for the pg_cron job that
// calls this every minute). Finds Time Anchors whose target_time has
// passed and sends a Web Push notification to every device the owning
// user has subscribed from — this is what lets a nudge arrive even when
// no tab/app is open.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:support@onwardapp.ir";
const CRON_SECRET = Deno.env.get("CRON_SECRET");

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  // Shared-secret check so only our own cron job (or someone who knows the
  // secret) can trigger sends. Skipped only if no secret was configured.
  if (CRON_SECRET) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== CRON_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const nowIso = new Date().toISOString();

  const { data: dueAnchors, error } = await supabase
    .from("time_anchors")
    .select("id, user_id, label")
    .eq("fired", false)
    .eq("dismissed", false)
    .lte("target_time", nowIso);

  if (error) {
    console.error("Failed to load due anchors", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!dueAnchors || dueAnchors.length === 0) {
    return new Response(JSON.stringify({ sent: 0, checked: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  let sent = 0;

  for (const anchor of dueAnchors) {
    const { data: subs, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", anchor.user_id);

    if (subsError) {
      console.error("Failed to load subscriptions for", anchor.user_id, subsError);
    }

    const payload = JSON.stringify({
      title: "⏰ Time Anchor",
      body: anchor.label,
      anchorId: anchor.id,
    });

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        sent++;
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription is gone (user revoked permission, uninstalled, etc.)
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.error("Push send failed for anchor", anchor.id, statusCode, err);
        }
      }
    }

    // Mark as fired regardless of delivery outcome so we never spam
    // retries for a subscription that's permanently broken.
    await supabase.from("time_anchors").update({ fired: true }).eq("id", anchor.id);
  }

  return new Response(JSON.stringify({ sent, checked: dueAnchors.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
