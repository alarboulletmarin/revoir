import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ItemsProvider } from './state/ItemsContext'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { CalendarPage } from './pages/CalendarPage'
import { ItemDetail } from './pages/ItemDetail'
import { ItemForm } from './pages/ItemForm'
import { Settings } from './pages/Settings'
import { NotFound } from './pages/NotFound'

export function App() {
  return (
    <ItemsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calendrier" element={<CalendarPage />} />
            <Route path="/nouveau" element={<ItemForm mode="create" />} />
            <Route path="/element/:id" element={<ItemDetail />} />
            <Route path="/element/:id/modifier" element={<ItemForm mode="edit" />} />
            <Route path="/reglages" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ItemsProvider>
  )
}
