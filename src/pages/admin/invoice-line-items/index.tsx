import dynamic from 'next/dynamic'

// Import your real component from views (or from same folder with a rename)
const InvoiceLine = dynamic(() => import('./invoiceLine'), {
  ssr: false
})

export default InvoiceLine
