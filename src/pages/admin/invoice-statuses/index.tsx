import dynamic from 'next/dynamic'

// Import your real component from views (or from same folder with a rename)
const InvoiceStstusPage = dynamic(() => import('./invoiceStatuses'), {
  ssr: false
})

export default InvoiceStstusPage
