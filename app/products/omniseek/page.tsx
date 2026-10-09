import { redirect } from 'next/navigation'

/** Legacy URL — product renamed to SeekDesk */
export default function OmniSeekRedirectPage() {
  redirect('/products/seekdesk')
}
