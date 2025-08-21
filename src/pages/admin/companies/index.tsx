import dynamic from 'next/dynamic'

// Import your real component from views (or from same folder with a rename)
const CompanyPage = dynamic(() => import('./companies'), {
  ssr: false
})

export default CompanyPage
