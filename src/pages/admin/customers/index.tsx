 import dynamic from 'next/dynamic'
 
 // Import your real component from views (or from same folder with a rename)
 const CustomersPage = dynamic(() => import('./customerPage'), {
   ssr: false
 })
 
 export default CustomersPage
 