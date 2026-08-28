import { useState } from 'react'
import Header from './components/layout/Header.jsx'
import MangaPage from './pages/MangaPage.jsx'

function App() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <>
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <MangaPage searchQuery={searchQuery} />
    </>
  )
}

export default App
