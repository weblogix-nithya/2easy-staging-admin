import dynamic from 'next/dynamic'

// Import your real component from views (or from same folder with a rename)
const InvoicePage = dynamic(() => import('./invoice'), {
  ssr: false
})

export default InvoicePage
