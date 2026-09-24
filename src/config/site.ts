import starter from "../../starter.config.json";

export const siteConfig = {
  id: starter.id,
  name: starter.name,
  description: starter.description,
  homePath: "/app",
  posPath: "/app",
  adminPath: "/admin",
} as const;
