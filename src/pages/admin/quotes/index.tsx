import dynamic from 'next/dynamic'

// Import your real component from views (or from same folder with a rename)
const QuotesPage = dynamic(() => import('./quotes'), {
  ssr: false
})

export default QuotesPage
