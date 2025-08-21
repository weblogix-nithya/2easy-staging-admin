import dynamic from 'next/dynamic'

// Import your real component from views (or from same folder with a rename)
const DriverPAge = dynamic(() => import('./drivers'), {
  ssr: false
})

export default DriverPAge
