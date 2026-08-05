import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ItemsProvider } from './state/ItemsContext'
import { ToastProvider } from './state/ToastContext'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { CalendarPage } from './pages/CalendarPage'
import { ItemDetail } from './pages/ItemDetail'
import { ItemForm } from './pages/ItemForm'
import { ReviewList } from './pages/ReviewList'
import { Settings } from './pages/Settings'
import { NotFound } from './pages/NotFound'

export function App() {
  return (
    <ItemsProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/revisions/:filtre" element={<ReviewList />} />
              <Route path="/calendrier" element={<CalendarPage />} />
              <Route path="/nouveau" element={<ItemForm mode="create" />} />
              <Route path="/element/:id" element={<ItemDetail />} />
              <Route path="/element/:id/modifier" element={<ItemForm mode="edit" />} />
              <Route path="/reglages" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ItemsProvider>
  )
}
