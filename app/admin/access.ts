import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../chatgpt-auth";

export async function getAdminAccess() {
  const user = await getChatGPTUser();
  if (!user) return { status: "signed-out" } as const;

  const { ENQUIRY_ADMIN_EMAILS } = env as { ENQUIRY_ADMIN_EMAILS?: string };
  const emails = (ENQUIRY_ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase());
  if (!emails.includes(user.email.toLowerCase())) return { status: "forbidden" } as const;

  return { status: "allowed", user } as const;
}
