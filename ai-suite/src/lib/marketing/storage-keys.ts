/** Client-side marketing / freemium keys (localStorage). */
export const FREE_TRIAL_USED_KEY = "isendai_free_trial_used";
export const USER_EMAIL_KEY = "isendai_user_email";

export function readFreeTrialUsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(FREE_TRIAL_USED_KEY) === "true";
  } catch {
    return false;
  }
}

export function setFreeTrialUsed(value: boolean) {
  try {
    localStorage.setItem(FREE_TRIAL_USED_KEY, value ? "true" : "false");
  } catch {
    // ignore
  }
}

export function readLeadEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(USER_EMAIL_KEY);
    return v && v.trim().length > 0 ? v.trim() : null;
  } catch {
    return null;
  }
}

export function saveLeadEmail(email: string) {
  try {
    localStorage.setItem(USER_EMAIL_KEY, email.trim());
  } catch {
    // ignore
  }
}
