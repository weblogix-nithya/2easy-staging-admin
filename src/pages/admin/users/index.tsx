import dynamic from 'next/dynamic'

// Import your real component from views (or from same folder with a rename)
const UserPage = dynamic(() => import('./users'), {
  ssr: false
})

export default UserPage
