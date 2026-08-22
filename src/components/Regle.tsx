// SPDX-License-Identifier: AGPL-3.0-only

/**
 * La règle des quatorze jours — section 8.8 du design system.
 *
 * C'est la structure de l'écran « Aujourd'hui », et non une illustration
 * posée dessus. Elle remplace à elle seule trois blocs qui se disputaient la
 * même réponse : la cellule du jour, la carte « en retard » et les barres de
 * charge. Un objet à balayer plutôt que trois à comparer.
 *
 * Ce qui s'y lit, dans cet ordre : ce qui tombe aujourd'hui, ce qui vient
 * ensuite, et à quelle distance. La géométrie vit dans `lib/regle.ts` ; ce
 * fichier ne fait que la poser.
 *
 * **La couleur ne porte rien seule** (section 1) : la charge d'une journée se
 * lit à la hauteur de sa graduation, s'écrit en chiffres au-dessus d'elle, et
 * chaque jour est une entrée de liste dont le texte — masqué à l'œil, lu par
 * les lecteurs d'écran — donne sa date et son effectif en toutes lettres.
 */
import { Link } from 'react-router-dom'
import type { DayLoad } from '../lib/stats'
import { formatCompact, formatShort, type DateKey } from '../lib/dates'
import { geometrieRegle } from '../lib/regle'
import { textes } from '../i18n'
import { useTextes } from '../state/usePreferences'

interface RegleProps {
  charge: DayLoad[]
  aujourdhui: DateKey
  /** Révisions restantes, tous horizons confondus : le compte de l'en-tête. */
  restantes: number
  /** Révisions en retard, pour la ligne qui suit la règle. */
  retard: number
}

export function Regle({ charge, aujourdhui, restantes, retard }: RegleProps) {
  const t = useTextes()
  const graduations = geometrieRegle(charge, aujourdhui)
  if (graduations.length === 0) return null

  return (
    <section className="regle" aria-label={t.regle.intitule(graduations.length)}>
      <div className="regle__entete">
        <h2 className="surtitre">{t.regle.titre}</h2>
        <p className="regle__total">
          <output>{restantes}</output> {t.dashboard.restantes(restantes)}
        </p>
      </div>

      <div className="regle__corps">
        {/* Le sol des graduations : c'est lui qui fait la règle graduée. */}
        <span className="regle__axe" aria-hidden="true" />

        <ul className="regle__jours">
          {graduations.map((graduation) => (
            <li
              key={graduation.date}
              className={
                graduation.estAujourdhui ? 'regle__jour regle__jour--auj' : 'regle__jour'
              }
            >
              <span className="invisible">
                {etiquetteJour(graduation.date, graduation.count, aujourdhui)}
              </span>

              {/*
                Le nombre se pose au-dessus de sa graduation et non à côté :
                à côté, deux journées voisines et chargées donneraient quatre
                nombres sur une ligne, sans qu'on sache lequel va avec lequel.
              */}
              {graduation.count > 0 && (
                <span className="regle__compte" aria-hidden="true">
                  {graduation.count}
                </span>
              )}

              <span
                className={`regle__graduation regle__graduation--${graduation.niveau}`}
                aria-hidden="true"
              />
            </li>
          ))}
        </ul>

        {/*
          Trois repères, chacun centré dans sa cellule. Une rangée de cellules
          vides plutôt qu'un `space-between` : réparti aux extrémités, un repère
          se calerait sur le bord de la règle et ne désignerait plus aucune
          graduation.
        */}
        <div className="regle__reperes" aria-hidden="true">
          {graduations.map((graduation) => (
            <span key={graduation.date} className="regle__cellule">
              {graduation.repere && (
                <span
                  className={
                    graduation.estAujourdhui ? 'regle__repere regle__repere--auj' : 'regle__repere'
                  }
                >
                  {graduation.estAujourdhui
                    ? t.charge.aujourdhuiCourt
                    : formatCompact(graduation.date)}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/*
        Le retard suit la règle au lieu d'occuper une carte à lui. Il n'accuse
        pas (section 1) : il se constate, et il propose le geste qui le solde.
      */}
      {retard > 0 && (
        <p className="regle__retard">
          <span className="regle__pastille" aria-hidden="true" />
          {t.regle.retard(retard)}
          {' — '}
          <Link to="/revisions/retard" className="lien">
            {retard > 1 ? t.regle.rattraperPlusieurs : t.regle.rattraper}
          </Link>
        </p>
      )}
    </section>
  )
}

/** « aujourd'hui, 3 révisions » · « ven. 7 août, aucune révision ». */
function etiquetteJour(date: DateKey, count: number, aujourdhui: DateKey): string {
  const quand =
    date === aujourdhui ? textes().dates.relatif.aujourdhui : formatShort(date)
  return textes().charge.jour(quand, count)
}
