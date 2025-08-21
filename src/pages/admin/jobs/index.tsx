import dynamic from 'next/dynamic'

// Import dynamically with SSR disabled and pass prop
const JobPage = dynamic(() => import('./jobs'), {
  ssr: false,
})

export default function JobsPageEntry() {
  return <JobPage />
}
