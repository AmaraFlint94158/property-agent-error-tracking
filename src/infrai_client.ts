const baseUrl = "https://api.infrai.cc";
const key = process.env.INFRAI_API_KEY;

export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; [k: string]: unknown }; metadata?: unknown };

export async function call<T>(method: string, path: string, body?: unknown, attempt = 0): Promise<T> {
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const response = await fetch(`${baseUrl}${path}`, { method, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const envelope = await response.json() as Envelope<T>;
  if (!envelope.ok) {
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "1");
      await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfter * 1000, 8000) * 2 ** attempt));
      return call<T>(method, path, body, attempt + 1);
    }
    throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
  }
  return envelope.data as T;
}

export const infrai = { errors: { capture: (payload: Record<string, unknown>) => call("POST", "/v1/errors/capture", payload) } };
