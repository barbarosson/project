/** Netlify Model B: explicit env preferred; URL heuristic as fallback. */
export type DeployEnv = "staging" | "production";

export function getDeployEnv(): DeployEnv {
  const explicit = process.env.NEXT_PUBLIC_DEPLOY_ENV?.trim().toLowerCase();
  if (explicit === "staging" || explicit === "production") {
    return explicit;
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().toLowerCase() ?? "";
  if (!site) return "production";

  if (site.includes("localhost") || site.includes("127.0.0.1")) {
    return "staging";
  }

  if (site.includes("netlify.app") && !site.includes("isendai.com")) {
    return "staging";
  }

  return "production";
}

export function isStagingDeploy(): boolean {
  return getDeployEnv() === "staging";
}
