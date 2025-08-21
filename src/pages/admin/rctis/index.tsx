import dynamic from 'next/dynamic'

// Import your real component from views (or from same folder with a rename)
const RctisPage = dynamic(() => import('./rctis'), {
  ssr: false
})

export default RctisPage
