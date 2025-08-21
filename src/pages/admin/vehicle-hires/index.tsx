import dynamic from 'next/dynamic'

// Import your real component from views (or from same folder with a rename)
const Vechilepage = dynamic(() => import('./vehicleHires'), {
  ssr: false
})

export default Vechilepage
