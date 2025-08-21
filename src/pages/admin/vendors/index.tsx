import dynamic from 'next/dynamic'

// Import your real component from views (or from same folder with a rename)
const VendorPage = dynamic(() => import('./vendors'), {
  ssr: false
})

export default VendorPage
