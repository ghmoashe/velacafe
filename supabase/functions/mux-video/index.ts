import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const muxTokenId = Deno.env.get("MUX_TOKEN_ID") ?? "";
const muxTokenSecret = Deno.env.get("MUX_TOKEN_SECRET") ?? "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader || !supabaseUrl || !supabaseAnonKey) {
    return {
      user: null,
      error: !authHeader
        ? "Missing Authorization header."
        : "SUPABASE_URL or SUPABASE_ANON_KEY is missing.",
    };
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return {
      user: null,
      error: error?.message ?? "No user resolved from access token.",
    };
  }
  return { user: data.user, error: null };
}

async function muxFetch(path: string, init?: RequestInit) {
  if (!muxTokenId || !muxTokenSecret) {
    throw new Error("Mux credentials are missing.");
  }
  const response = await fetch(`https://api.mux.com${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${btoa(`${muxTokenId}:${muxTokenSecret}`)}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const message = await response.text();
    console.error("[mux-video] Mux API request failed", {
      path,
      status: response.status,
      message,
    });
    throw new Error(message || `Mux request failed with status ${response.status}.`);
  }
  if (response.status === 204) return null;
  return await response.json();
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    const { user, error: authError } = await requireUser(req);
    if (!user) {
      console.warn("[mux-video] Unauthorized request", {
        method: req.method,
        authError,
      });
      return json(401, {
        error: authError || "Unauthorized",
      });
    }

    const body = await req.json();
    const action =
      typeof body?.action === "string" ? body.action.toLowerCase() : "";
    console.log("[mux-video] Request received", {
      method: req.method,
      action,
      userId: user.id,
    });

    if (action === "create-upload") {
      const origin =
        typeof body.origin === "string" && body.origin.trim()
          ? body.origin.trim()
          : "*";
      const filename =
        typeof body.filename === "string" ? body.filename.trim() : "video";
      const data = await muxFetch("/video/v1/uploads", {
        method: "POST",
        body: JSON.stringify({
          cors_origin: origin,
          new_asset_settings: {
            playback_policies: ["public"],
            video_quality: "basic",
            passthrough: JSON.stringify({
              user_id: user.id,
              filename,
            }),
          },
        }),
      });

      return json(200, {
        uploadId: data?.data?.id ?? null,
        uploadUrl: data?.data?.url ?? null,
      });
    }

    if (action === "get-upload") {
      const uploadId =
        typeof body.uploadId === "string" ? body.uploadId.trim() : "";
      if (!uploadId) {
        return json(400, { error: "uploadId is required" });
      }
      const upload = await muxFetch(`/video/v1/uploads/${uploadId}`);
      const assetId = upload?.data?.asset_id ?? null;
      if (!assetId) {
        return json(200, {
          uploadStatus: upload?.data?.status ?? null,
          assetStatus: null,
          assetId: null,
          playbackId: null,
        });
      }
      const asset = await muxFetch(`/video/v1/assets/${assetId}`);
      const playbackId =
        asset?.data?.playback_ids?.find?.(
          (item: { policy?: string; id?: string }) => item.policy === "public"
        )?.id ?? asset?.data?.playback_ids?.[0]?.id ?? null;
      return json(200, {
        uploadStatus: upload?.data?.status ?? null,
        assetStatus: asset?.data?.status ?? null,
        assetId,
        playbackId,
      });
    }

    if (action === "delete-asset") {
      const assetId = typeof body.assetId === "string" ? body.assetId.trim() : "";
      if (!assetId) {
        return json(400, { error: "assetId is required" });
      }
      await muxFetch(`/video/v1/assets/${assetId}`, { method: "DELETE" });
      return json(200, { ok: true });
    }

    return json(400, { error: "Unsupported action" });
  } catch (error) {
    console.error("[mux-video] Request failed", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null,
    });
    return json(500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
