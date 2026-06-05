import type { LucideIcon } from 'lucide-react'
import { Facebook, Github, Linkedin, Twitter } from 'lucide-react'

export type SocialLink = {
  name: string
  icon: LucideIcon
  href: string
}

function trimUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed.replace(/\/$/, '') : undefined
}

/** Public social profiles for MODULUS (modulusaas.com). Icons render only when URL is set. */
export function getModulusSocialLinks(): SocialLink[] {
  const candidates: Array<{ name: string; icon: LucideIcon; href?: string }> = [
    { name: 'LinkedIn', icon: Linkedin, href: trimUrl(process.env.NEXT_PUBLIC_MODULUS_LINKEDIN_URL) },
    { name: 'Twitter', icon: Twitter, href: trimUrl(process.env.NEXT_PUBLIC_MODULUS_TWITTER_URL) },
    { name: 'Facebook', icon: Facebook, href: trimUrl(process.env.NEXT_PUBLIC_MODULUS_FACEBOOK_URL) },
    { name: 'GitHub', icon: Github, href: trimUrl(process.env.NEXT_PUBLIC_MODULUS_GITHUB_URL) },
  ]

  return candidates.filter((item): item is SocialLink => Boolean(item.href))
}
