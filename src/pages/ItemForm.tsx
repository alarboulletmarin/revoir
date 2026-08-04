import { useEffect, useId, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useItems } from '../state/useItems'
import { DEFAULT_SCHEDULE, SCHEDULES, getSchedule, previewDates } from '../lib/schedules'
import { formatShort, todayKey } from '../lib/dates'
import { usedCategories } from '../lib/stats'
import type { ScheduleId } from '../types'

const SUGGESTED_CATEGORIES = [
  'Études',
  'Travail',
  'Développement',
  'Langues',
  'Lecture',
  'Personnel',
  'Autre',
]

export function ItemForm({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { items, loading, createItem, editItem } = useItems()
  const listId = useId()

  const existing = mode === 'edit' ? items.find((item) => item.id === id) : undefined

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [startDate, setStartDate] = useState(todayKey)
  const [schedule, setSchedule] = useState<ScheduleId>(DEFAULT_SCHEDULE)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  // Les éléments arrivent de façon asynchrone : on remplit le formulaire dès
  // que l'élément visé est disponible.
  useEffect(() => {
    if (!existing) return
    setTitle(existing.title)
    setCategory(existing.category)
    setStartDate(existing.startDate)
    setSchedule(existing.schedule)
  }, [existing])

  const preview = useMemo(() => {
    // Le champ date peut être vide pendant la saisie : pas de prévisualisation
    // tant qu'il n'y a rien à calculer.
    if (startDate === '') return []
    const dates = previewDates(startDate, schedule)
    return getSchedule(schedule).offsets.map((offset, index) => ({
      offset,
      date: dates[index],
    }))
  }, [startDate, schedule])

  const categories = useMemo(() => {
    const used = usedCategories(items)
    return [...new Set([...used, ...SUGGESTED_CATEGORIES])]
  }, [items])

  const titleError = title.trim() === '' ? 'Le titre est obligatoire.' : null
  const dateError = startDate === '' ? 'La date de départ est obligatoire.' : null

  if (mode === 'edit' && !existing) {
    return loading ? (
      <p className="loading">Chargement…</p>
    ) : (
      <p className="muted">Cet élément n’existe pas ou plus.</p>
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (titleError || dateError || saving) return

    setSaving(true)
    const draft = { title, category, startDate, schedule }
    try {
      if (mode === 'edit' && existing) {
        await editItem(existing.id, draft)
        navigate(`/element/${existing.id}`, { replace: true })
      } else {
        const created = await createItem(draft)
        navigate(`/element/${created.id}`, { replace: true })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stack">
      <h1 className="page-title">
        {mode === 'edit' ? 'Modifier l’élément' : 'Nouvel élément'}
      </h1>

      <form className="card section form" onSubmit={submit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="title">
            Titre
          </label>
          <input
            id="title"
            className="input"
            type="text"
            value={title}
            maxLength={120}
            autoComplete="off"
            placeholder="Hooks React, Chapitre 5, Vocabulaire espagnol…"
            onChange={(event) => setTitle(event.target.value)}
            aria-invalid={submitted && titleError !== null}
            aria-describedby={submitted && titleError ? 'title-error' : undefined}
          />
          {submitted && titleError && (
            <p className="field__error" id="title-error">
              {titleError}
            </p>
          )}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="category">
            Catégorie
          </label>
          <input
            id="category"
            className="input"
            type="text"
            value={category}
            maxLength={60}
            list={listId}
            autoComplete="off"
            placeholder="Études, Travail, Langues…"
            onChange={(event) => setCategory(event.target.value)}
          />
          <datalist id={listId}>
            {categories.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="startDate">
            Date de départ
          </label>
          <input
            id="startDate"
            className="input"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            aria-invalid={submitted && dateError !== null}
          />
          {submitted && dateError && <p className="field__error">{dateError}</p>}
        </div>

        <fieldset className="field field--fieldset">
          <legend className="field__label">Configuration</legend>
          <div className="choices">
            {SCHEDULES.map((option) => (
              <label
                key={option.id}
                className={`choice${schedule === option.id ? ' choice--active' : ''}`}
              >
                <input
                  type="radio"
                  name="schedule"
                  value={option.id}
                  checked={schedule === option.id}
                  onChange={() => setSchedule(option.id)}
                />
                <span className="choice__label">{option.label}</span>
                <span className="choice__description">{option.description}</span>
                <span className="choice__offsets">
                  {option.offsets.map((offset) => `J+${offset}`).join(' · ')}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="preview">
          <h2 className="preview__title">
            Prochaines révisions <span className="count">{preview.length}</span>
          </h2>
          <ul className="preview__list">
            {preview.map((entry) => (
              <li key={entry.offset} className="preview__item">
                <span className="preview__offset">J+{entry.offset}</span>
                <span>{formatShort(entry.date)}</span>
              </li>
            ))}
          </ul>
          {mode === 'edit' && (
            <p className="muted preview__note">
              Les révisions déjà effectuées restent cochées si leur décalage existe
              toujours dans la configuration choisie.
            </p>
          )}
        </div>

        <div className="form__actions">
          <button
            type="button"
            className="button button--ghost"
            onClick={() => navigate(-1)}
          >
            Annuler
          </button>
          <button type="submit" className="button" disabled={saving}>
            {mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
  )
}
