import { createElement, useEffect } from "react";
import type { CSSProperties } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

const MUX_FUNCTION_NAME = import.meta.env.VITE_MUX_FUNCTION_NAME ?? "mux-video";
const MUX_PLAYBACK_BASE_URL =
  import.meta.env.VITE_MUX_PLAYBACK_BASE_URL ?? "https://stream.mux.com";
const MUX_PLAYER_SCRIPT_URL =
  import.meta.env.VITE_MUX_PLAYER_SCRIPT_URL ??
  "https://cdn.jsdelivr.net/npm/@mux/mux-player";

let muxPlayerScriptPromise: Promise<void> | null = null;

export type MuxPlayerElement = HTMLElement & {
  play: () => Promise<void>;
  pause: () => void;
  muted: boolean;
  paused: boolean;
};

type MuxCreateUploadResponse = {
  uploadId: string;
  uploadUrl: string;
};

type MuxUploadStatusResponse = {
  uploadStatus: string | null;
  assetStatus: string | null;
  assetId: string | null;
  playbackId: string | null;
};

async function normalizeFunctionError(error: unknown) {
  if (!error || typeof error !== "object") return new Error("Mux request failed.");
  const context =
    "context" in error ? (error as { context?: unknown }).context : null;
  if (context && typeof context === "object") {
    if ("json" in context && typeof context.json === "function") {
      try {
        const payload = await context.json();
        if (payload && typeof payload === "object") {
          const message =
            "error" in payload && typeof payload.error === "string"
              ? payload.error
              : "message" in payload && typeof payload.message === "string"
                ? payload.message
                : "";
          if (message.trim()) {
            return new Error(message);
          }
        }
      } catch {
        // Ignore and fall back to text/message parsing below.
      }
    }
    if ("text" in context && typeof context.text === "function") {
      try {
        const message = await context.text();
        if (typeof message === "string" && message.trim()) {
          return new Error(message);
        }
      } catch {
        // Ignore and fall back to message parsing below.
      }
    }
  }
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message
      : "Mux request failed.";
  return new Error(message);
}

export function buildMuxPlaybackUrl(playbackId: string) {
  return `${MUX_PLAYBACK_BASE_URL.replace(/\/+$/, "")}/${playbackId}.m3u8`;
}

export function extractMuxPlaybackId(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/stream\.mux\.com\/([^./?#]+)(?:\.[^/?#]+)?/i);
  if (match?.[1]) return match[1];
  if (/^[a-z0-9]{10,}$/i.test(trimmed) && !trimmed.includes("/")) {
    return trimmed;
  }
  return null;
}

export function isMuxPlaybackSource(value: string | null | undefined) {
  return Boolean(extractMuxPlaybackId(value));
}

export async function ensureMuxPlayerLoaded() {
  if (typeof window === "undefined") return;
  if (window.customElements?.get("mux-player")) return;
  if (!muxPlayerScriptPromise) {
    muxPlayerScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[data-mux-player-script="1"]`
      );
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("Failed to load Mux Player script.")),
          { once: true }
        );
        return;
      }
      const script = document.createElement("script");
      script.src = MUX_PLAYER_SCRIPT_URL;
      script.async = true;
      script.dataset.muxPlayerScript = "1";
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Failed to load Mux Player script."));
      document.head.appendChild(script);
    });
  }
  await muxPlayerScriptPromise;
}

export function MuxPlayer(props: {
  playbackId: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  playerRef?: (node: MuxPlayerElement | null) => void;
}) {
  const {
    playbackId,
    className,
    controls,
    autoPlay,
    muted,
    loop,
    onClick,
    style,
    playerRef,
  } = props;
  useEffect(() => {
    void ensureMuxPlayerLoaded();
  }, []);

  return createElement("mux-player", {
    ref: playerRef,
    className,
    style,
    "playback-id": playbackId,
    "stream-type": "on-demand",
    preload: "metadata",
    controls: controls ? "" : undefined,
    muted,
    loop,
    playsinline: "",
    autoplay: autoPlay ? "muted" : undefined,
    onClick,
  });
}

export async function createMuxDirectUpload(
  supabase: SupabaseClient,
  input: { origin: string; filename: string; contentType: string; userId: string }
) {
  const { data, error } = await supabase.functions.invoke(MUX_FUNCTION_NAME, {
    body: {
      action: "create-upload",
      origin: input.origin,
      filename: input.filename,
      contentType: input.contentType,
      userId: input.userId,
    },
  });
  if (error) throw await normalizeFunctionError(error);
  return data as MuxCreateUploadResponse;
}

export async function getMuxUploadStatus(
  supabase: SupabaseClient,
  uploadId: string
) {
  const { data, error } = await supabase.functions.invoke(MUX_FUNCTION_NAME, {
    body: {
      action: "get-upload",
      uploadId,
    },
  });
  if (error) throw await normalizeFunctionError(error);
  return data as MuxUploadStatusResponse;
}

export async function deleteMuxAsset(
  supabase: SupabaseClient,
  assetId: string
) {
  const { error } = await supabase.functions.invoke(MUX_FUNCTION_NAME, {
    body: {
      action: "delete-asset",
      assetId,
    },
  });
  if (error) throw await normalizeFunctionError(error);
}

export async function uploadFileToMux(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });
  if (!response.ok) {
    throw new Error(`Mux upload failed with status ${response.status}.`);
  }
}

export async function waitForMuxPlayback(
  supabase: SupabaseClient,
  uploadId: string,
  options?: {
    timeoutMs?: number;
    intervalMs?: number;
    onProgress?: (status: MuxUploadStatusResponse) => void;
  }
) {
  const timeoutMs = options?.timeoutMs ?? 180000;
  const intervalMs = options?.intervalMs ?? 2000;
  const startedAt = Date.now();

  for (;;) {
    const status = await getMuxUploadStatus(supabase, uploadId);
    options?.onProgress?.(status);
    if (status.assetStatus === "ready" && status.playbackId) {
      return status;
    }
    if (status.assetStatus === "errored") {
      throw new Error("Mux could not process this video.");
    }
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("Mux is still processing the video. Please try again.");
    }
    await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
  }
}
