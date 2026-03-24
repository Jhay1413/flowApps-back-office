import { createFileRoute } from '@tanstack/react-router'
import { PaymentDetailPage } from '@/pages/payments/PaymentDetailPage'

export const Route = createFileRoute('/_admin/payments/$paymentId')({
  component: PaymentDetailPage,
})
