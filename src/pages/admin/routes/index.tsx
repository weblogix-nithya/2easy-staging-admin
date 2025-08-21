import dynamic from 'next/dynamic'

// Import your real component from views (or from same folder with a rename)
const RoutesPage = dynamic(() => import('./routes'), {
  ssr: false
})

export default RoutesPage
