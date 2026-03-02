# PayTrack

Plateforme personnelle de suivi et analyse de bulletins de paie — conçue pour les stagiaires et alternants.

## Installation en 3 commandes

```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Ouvrez http://localhost:3000 — le dashboard s'affiche déjà avec un bulletin de démonstration.

## Fonctionnalités

- **Import PDF** : glissez-déposez votre bulletin PayFit, Sage, ADP, Silae ou autre
- **Extraction automatique** : 20+ champs extraits par regex intelligent
- **Dashboard** : 12 KPIs animés, 7 graphiques (évolution, donut, cumul, efficacité, heures, TLT)
- **Insights** : analyses automatiques contextualisées (benchmark SMIC, projection, taux horaire)
- **Benchmarks** : comparaison minimum légal de stage (3,90€/h en 2026) et SMIC
- **Timeline** : vue chronologique du contrat avec progression
- **Historique** : liste, détail, modification, suppression de chaque bulletin
- **Export CSV** : toutes les données en un clic

## Ajouter un nouveau bulletin

### Via PDF (recommandé)
1. Allez sur http://localhost:3000/upload
2. Glissez votre fichier PDF PayFit / Sage / ADP
3. Vérifiez les données extraites (score de confiance affiché)
4. Corrigez si nécessaire via le formulaire inline

### Via saisie manuelle
1. Allez sur http://localhost:3000/bulletin/new
2. Remplissez les champs directement
3. Cliquez sur "Sauvegarder"

## Structure du parser PDF

Le parser se trouve dans `lib/pdf-parser.ts`. Il utilise une architecture à **patterns en cascade** :

```typescript
// Chaque champ a plusieurs patterns regex (fallback chain)
const netApayer = tryNumberPatterns(text, [
  /net\s+[àa]\s+payer\s*:?\s*([\d\s]+[,.][\d]{2})/i,
  /montant\s+net\s+[àa]\s+payer\s*:?\s*([\d\s]+[,.][\d]{2})/i,
  /net\s+pay[ée]\s*:?\s*([\d\s]+[,.][\d]{2})/i,
])
```

- **Nombres français** : `"1 233,33"` → suppression des espaces → remplacement `,` par `.` → `1233.33`
- **Dates** : gestion de `"01/02/2026"`, `"1er février 2026"`, `"février 2026"`
- **Score de confiance** : 0-100% basé sur les champs détectés (70% obligatoires + 30% optionnels)
- **Jamais bloquant** : chaque champ manquant reste `null`, jamais une erreur

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Style | Tailwind CSS |
| Base de données | SQLite via Prisma |
| Extraction PDF | pdf-parse + regex |
| Graphiques | Recharts |
| Upload | react-dropzone |
| Notifications | Sonner |

## Références 2026

| Indicateur | Valeur |
|-----------|--------|
| SMIC horaire brut | 11,88 €/h |
| Minimum légal stage | 3,90 €/h |
| Minimum légal stage/mois (35h) | ~591 €/mois |
| SMIC net mensuel estimé | ~1 426 €/mois |

## Variables d'environnement

```bash
# .env
DATABASE_URL="file:./dev.db"
```

## Commandes utiles

```bash
npm run dev          # Démarrage en développement
npm run build        # Build de production
npx prisma studio    # Interface visuelle de la base de données
npx prisma db seed   # Re-initialiser les données de démo
```
