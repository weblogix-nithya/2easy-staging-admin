import dynamic from 'next/dynamic'

// Import your real component from views (or from same folder with a rename)
const ClientPage = dynamic(() => import('./client'), {
  ssr: false
})

export default ClientPage
