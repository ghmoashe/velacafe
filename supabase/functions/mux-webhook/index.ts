import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const muxWebhookSecret = Deno.env.get("MUX_WEBHOOK_SECRET") ?? "";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeCompare(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

function parseMuxSignature(header: string | null) {
  if (!header?.trim()) return null;
  const parts = header.split(",").map((item) => item.trim());
  const timestamp = parts
    .find((item) => item.startsWith("t="))
    ?.slice(2)
    .trim();
  const signatures = parts
    .filter((item) => item.startsWith("v1="))
    .map((item) => item.slice(3).trim())
    .filter(Boolean);
  if (!timestamp || signatures.length === 0) return null;
  return { timestamp, signatures };
}

async function verifyMuxSignature(rawBody: string, header: string | null) {
  if (!muxWebhookSecret.trim()) {
    throw new Error("MUX_WEBHOOK_SECRET is missing.");
  }
  const parsed = parseMuxSignature(header);
  if (!parsed) return false;
  const timestampNumber = Number(parsed.timestamp);
  if (!Number.isFinite(timestampNumber)) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - timestampNumber);
  if (ageSeconds > 300) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(muxWebhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const payload = `${parsed.timestamp}.${rawBody}`;
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const computed = toHex(signature);
  return parsed.signatures.some((candidate) => timingSafeCompare(candidate, computed));
}

function getPublicPlaybackId(playbackIds: Array<{ id?: string; policy?: string }> | null | undefined) {
  return (
    playbackIds?.find((item) => item.policy === "public")?.id ??
    playbackIds?.[0]?.id ??
    null
  );
}

function buildMuxThumbnailUrl(playbackId: string) {
  return `https://image.mux.com/${playbackId}/thumbnail.webp?time=1`;
}

function getAspectRatio(payload: Record<string, unknown>) {
  const aspect = payload.aspect_ratio;
  if (typeof aspect === "number" && Number.isFinite(aspect)) {
    return aspect;
  }
  if (typeof aspect === "string" && aspect.includes(":")) {
    const [width, height] = aspect.split(":").map((value) => Number(value));
    if (Number.isFinite(width) && Number.isFinite(height) && height > 0) {
      return width / height;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return json(405, { error: "Method not allowed" });
    }
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return json(500, { error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing." });
    }

    const rawBody = await req.text();
    const signatureValid = await verifyMuxSignature(
      rawBody,
      req.headers.get("Mux-Signature")
    );
    if (!signatureValid) {
      return json(401, { error: "Invalid Mux signature." });
    }

    const event = JSON.parse(rawBody) as {
      type?: string;
      data?: Record<string, unknown>;
    };
    const eventType = typeof event.type === "string" ? event.type : "";
    const data = event.data ?? {};
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    if (eventType === "video.upload.asset_created") {
      const uploadId = typeof data.id === "string" ? data.id : "";
      const assetId = typeof data.asset_id === "string" ? data.asset_id : "";
      if (uploadId && assetId) {
        await supabase
          .from("posts")
          .update({
            mux_upload_id: uploadId,
            mux_asset_id: assetId,
            mux_asset_status: "created",
          })
          .eq("mux_upload_id", uploadId);
      }
      return json(200, { ok: true, eventType });
    }

    if (eventType === "video.asset.ready" || eventType === "video.asset.errored") {
      const assetId = typeof data.id === "string" ? data.id : "";
      if (assetId) {
        const playbackId = getPublicPlaybackId(
          Array.isArray(data.playback_ids)
            ? (data.playback_ids as Array<{ id?: string; policy?: string }>)
            : null
        );
        const assetStatus =
          typeof data.status === "string"
            ? data.status
            : eventType === "video.asset.ready"
              ? "ready"
              : "errored";
        const durationSeconds =
          typeof data.duration === "number" && Number.isFinite(data.duration)
            ? data.duration
            : null;
        const muxThumbnailUrl = playbackId ? buildMuxThumbnailUrl(playbackId) : null;
        const aspectRatio = getAspectRatio(data);

        const { data: posts } = await supabase
          .from("posts")
          .select("id,cover_url")
          .eq("mux_asset_id", assetId);

        for (const post of posts ?? []) {
          const nextCoverUrl =
            post.cover_url && String(post.cover_url).trim()
              ? post.cover_url
              : muxThumbnailUrl;
          await supabase
            .from("posts")
            .update({
              mux_asset_status: assetStatus,
              mux_duration_seconds: durationSeconds,
              mux_aspect_ratio: aspectRatio,
              mux_thumbnail_url: muxThumbnailUrl,
              cover_url: nextCoverUrl,
            })
            .eq("id", post.id);
        }
      }
      return json(200, { ok: true, eventType });
    }

    return json(200, { ok: true, ignored: true, eventType });
  } catch (error) {
    console.error("[mux-webhook] Failed", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null,
    });
    return json(500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
