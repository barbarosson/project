'use client'

import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/contexts/language-context'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ComponentProps } from 'react'

interface DemoRestrictedButtonProps extends ComponentProps<typeof Button> {
  action?: 'delete' | 'modify' | 'save'
  showToast?: boolean
}

export function DemoRestrictedButton({
  action = 'modify',
  showToast = true,
  onClick,
  disabled,
  children,
  ...props
}: DemoRestrictedButtonProps) {
  const { isDemo, canModifyData } = useAuth()
  const { language } = useLanguage()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDemo && !canModifyData) {
      if (showToast) {
        const message =
          language === 'tr'
            ? 'Demo modunda veri değişikliği yapılamaz.'
            : 'Data modification is not allowed in demo mode.'
        toast.error(message, { duration: 5000 })
      }
      e.preventDefault()
      return
    }

    if (onClick) {
      onClick(e)
    }
  }

  const isDisabled = disabled || (isDemo && !canModifyData)

  return (
    <Button {...props} disabled={isDisabled} onClick={handleClick}>
      {children}
    </Button>
  )
}
