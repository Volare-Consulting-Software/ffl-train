import { createHash } from "node:crypto";

/** A salted hash of the caller's IP address, so the weekly date limit works without accounts or cookies. */
export function clientIdFrom(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || headers.get("x-real-ip") || "local";
  return createHash("sha256").update(`${process.env.CLIENT_ID_SALT ?? ""}:${ip}`).digest("hex");
}
