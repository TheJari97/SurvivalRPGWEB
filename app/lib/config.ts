export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "SurvivalRPG",
  domain: process.env.NEXT_PUBLIC_APP_DOMAIN ?? "survivalrpgdota.com",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://survivalrpgdota.com",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "",
  steamLoginEnabled: process.env.NEXT_PUBLIC_STEAM_LOGIN_ENABLED === "true",
  paymentsEnabled: process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true",
};
