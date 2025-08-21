import dynamic from 'next/dynamic'

// Import your real component from views (or from same folder with a rename)
const RoutePointpage = dynamic(() => import('./routePoints'), {
  ssr: false
})

export default RoutePointpage
