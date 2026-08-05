// SPDX-License-Identifier: AGPL-3.0-only

import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { DonneesProvider } from './state/DonneesContext'
import { ToastProvider } from './state/ToastContext'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { CalendarPage } from './pages/CalendarPage'
import { SujetDetail } from './pages/SujetDetail'
import { SujetForm } from './pages/SujetForm'
import { CategoriesPage } from './pages/CategoriesPage'
import { CategorieForm } from './pages/CategorieForm'
import { ProgrammeForm } from './pages/ProgrammeForm'
import { ReviewList } from './pages/ReviewList'
import { Settings } from './pages/Settings'
import { Aide } from './pages/Aide'
import { Suivi } from './pages/Suivi'
import { NotFound } from './pages/NotFound'

/**
 * Les adresses d'avant le renommage.
 *
 * L'application est installable : des raccourcis `/element/:id` vivent sur des
 * écrans d'accueil, et la migration conserve l'identifiant du sujet. Ces deux
 * routes coûtent quatre lignes et évitent une impasse à qui a posé l'app avant
 * la mise à jour.
 */
function VersSujet({ suffixe = '' }: { suffixe?: string }) {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/sujet/${id}${suffixe}`} replace />
}

export function App() {
  return (
    <DonneesProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/revisions/:filtre" element={<ReviewList />} />
              <Route path="/calendrier" element={<CalendarPage />} />
              <Route path="/suivi" element={<Suivi />} />
              <Route path="/nouveau" element={<SujetForm mode="create" />} />
              <Route path="/sujet/:id" element={<SujetDetail />} />
              <Route path="/sujet/:id/modifier" element={<SujetForm mode="edit" />} />
              <Route path="/reglages" element={<Settings />} />
              <Route path="/aide" element={<Aide />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/categories/nouvelle" element={<CategorieForm mode="create" />} />
              <Route
                path="/categories/:id/modifier"
                element={<CategorieForm mode="edit" />}
              />
              <Route path="/programmes/nouveau" element={<ProgrammeForm mode="create" />} />
              <Route
                path="/programmes/:id/modifier"
                element={<ProgrammeForm mode="edit" />}
              />
              <Route path="/element/:id" element={<VersSujet />} />
              <Route path="/element/:id/modifier" element={<VersSujet suffixe="/modifier" />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </DonneesProvider>
  )
}
