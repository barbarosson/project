'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useLanguage } from '@/contexts/language-context'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
  itemCount?: number
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemCount,
}: ConfirmDeleteDialogProps) {
  const { t, language } = useLanguage()
  const { isDemo, canDeleteData } = useAuth()

  const dialogTitle = title || (itemCount && itemCount > 1 ? t.common.bulkDelete : t.common.confirmDelete)
  const dialogDescription = description || (itemCount && itemCount > 1
    ? t.common.bulkDeleteMessage.replace('{count}', itemCount.toString())
    : t.common.confirmDeleteMessage)

  const handleConfirm = () => {
    if (isDemo && !canDeleteData) {
      toast.error(
        language === 'tr'
          ? 'Demo modunda veri değişikliği yapılamaz.'
          : 'Data modification is not allowed in demo mode.',
        { duration: 5000 }
      )
      onOpenChange(false)
      return
    }
    onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
          <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {t.common.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
