# 🚀 Plateforme de Gestion & Analyse des Ventes - Frontend Refactoring

## 📋 Vue d'ensemble

Cette documentation décrit l'architecture refactorisée du frontend de la Plateforme de Gestion & Analyse des Ventes, développée avec React 19, Vite, Tailwind CSS et Material-UI.

## 🏗️ Architecture

```
src/
├── api/                    # Couche API centralisée
│   ├── axios.js           # Instance Axios avec interceptors
│   └── index.js           # Export de tous les services API
│
├── auth/                   # Système d'authentification
│   ├── AuthProvider.jsx   # Context d'auth avec RBAC
│   ├── RouteGuards.jsx    # Composants de protection des routes
│   └── index.js
│
├── components/             # Composants réutilisables
│   ├── cards/
│   │   ├── KpiCard.jsx    # Cartes KPI avec variantes
│   │   └── ChartCard.jsx  # Container pour graphiques
│   ├── charts/            # Composants graphiques
│   ├── common/
│   │   └── LoadingScreen.jsx  # États de chargement
│   ├── exports/
│   │   └── ExportMenu.jsx # Export CSV/Excel/PDF
│   ├── filters/
│   │   └── FilterPanel.jsx # Filtres avancés
│   └── tables/
│       └── DataTable.jsx  # Table de données complète
│
├── layouts/                # Layouts d'application
│   ├── MainLayout.jsx     # Layout principal avec sidebar
│   └── components/
│       ├── Sidebar.jsx    # Navigation role-based
│       └── Topbar.jsx     # Header avec notifications
│
├── pages/                  # Pages par rôle
│   ├── admin/
│   │   └── Dashboard.jsx  # Dashboard administrateur
│   ├── vendeur/
│   │   └── Dashboard.jsx  # Dashboard vendeur
│   ├── analyst/
│   │   └── Workspace.jsx  # Espace analyste
│   ├── investor/
│   │   └── Dashboard.jsx  # Dashboard investisseur
│   ├── reports/
│   │   ├── SalesReport.jsx    # Rapport des ventes
│   │   └── ProductsReport.jsx # Rapport des produits
│   └── alerts/
│       └── AlertsPage.jsx # Gestion des alertes
│
├── router/
│   └── AppRouterNew.jsx   # Router avec lazy loading
│
├── theme/
│   └── ThemeProvider.jsx  # Dark mode MUI + Tailwind
│
└── main-new.jsx           # Point d'entrée avec providers
```

## 🎨 Système de thème

### Dark Mode Global

Le dark mode est implémenté via:
- **ThemeProvider**: Synchronise MUI et Tailwind
- **CSS Variables**: Variables CSS pour les couleurs dynamiques
- **Tailwind `dark:` prefix**: Classes conditionnelles

```jsx
// Utilisation dans les composants
import { useTheme } from '../theme/ThemeProvider';

function MyComponent() {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <div className="bg-white dark:bg-slate-800">
      {/* Le dark mode s'applique automatiquement */}
    </div>
  );
}
```

## 🔐 Système d'authentification

### Rôles supportés
- **ADMIN**: Accès complet à toutes les fonctionnalités
- **VENDEUR**: Gestion des ventes et produits
- **ANALYST**: Analyse avancée des données
- **INVESTISSEUR**: Vue stratégique et rapports

### Protection des routes

```jsx
import { RequireAuth, RequireRole } from '../auth';

// Route protégée
<Route
  path="/admin/dashboard"
  element={
    <RequireAuth>
      <RequireRole roles={["ADMIN"]}>
        <AdminDashboard />
      </RequireRole>
    </RequireAuth>
  }
/>
```

## 📊 Composants réutilisables

### KpiCard
```jsx
<KpiCard
  title="Chiffre d'affaires"
  value="125 000 MAD"
  icon="revenue"
  color="blue"
  trend={{ value: 12.5, isPositive: true }}
  loading={false}
/>
```

### DataTable
```jsx
<DataTable
  columns={columns}
  data={data}
  loading={loading}
  onExport={handleExport}
  onRowClick={handleRowClick}
/>
```

### FilterPanel
```jsx
<FilterPanel
  filters={[
    { key: 'dateRange', type: 'dateRange', label: 'Période' },
    { key: 'category', type: 'select', label: 'Catégorie', options: [...] },
  ]}
  values={filters}
  onChange={setFilters}
/>
```

### ExportMenu
```jsx
<ExportMenu
  data={data}
  columns={columns}
  filename="rapport"
  title="Mon Rapport"
/>
```

## 🔄 Intégration API

### Structure des services

```jsx
import { analyticsApi, salesApi, productsApi } from '../api';

// Exemple d'utilisation
const loadData = async () => {
  const [kpis, sales] = await Promise.all([
    analyticsApi.getStatistics(),
    salesApi.getAll({ startDate, endDate }),
  ]);
};
```

### Endpoints backend intégrés
- `/api/auth/*` - Authentification
- `/api/products/*` - Gestion produits
- `/api/categories/*` - Gestion catégories
- `/api/sales/*` - Gestion ventes
- `/api/users/*` - Gestion utilisateurs
- `/api/analytics/*` - Statistiques
- `/api/alerts/*` - Alertes

## 📱 Responsive Design

L'interface est entièrement responsive avec:
- Sidebar collapsible sur mobile
- Grilles adaptatives (1 → 2 → 4 colonnes)
- Navigation mobile-first

## 🚀 Migration vers la nouvelle architecture

### Étape 1: Renommer les fichiers
```bash
# Backup de l'ancien router
mv src/router/AppRouter.jsx src/router/AppRouter.backup.jsx
mv src/router/AppRouterNew.jsx src/router/AppRouter.jsx

# Backup de l'ancien main
mv src/main.jsx src/main.backup.jsx
mv src/main-new.jsx src/main.jsx
```

### Étape 2: Vérifier les imports
Assurez-vous que tous les composants legacy sont accessibles aux chemins importés.

### Étape 3: Tester
```bash
npm run dev
```

## 📦 Dépendances utilisées

- **React 19** - Framework UI
- **Vite** - Build tool
- **Tailwind CSS 3.4** - Styling
- **MUI 7** - Composants UI
- **Recharts 3.5** - Graphiques
- **Framer Motion 12** - Animations
- **xlsx** - Export Excel
- **jsPDF** - Export PDF
- **Lucide React** - Icônes
- **date-fns** - Manipulation dates

## 📝 Conventions de code

- **Composants**: PascalCase (ex: `KpiCard.jsx`)
- **Hooks**: camelCase avec préfixe "use" (ex: `useTheme`)
- **Services**: camelCase avec suffixe "Api" (ex: `salesApi`)
- **CSS**: Classes Tailwind, dark: prefix pour dark mode

## 🔧 Scripts disponibles

```bash
npm run dev      # Développement
npm run build    # Build production
npm run preview  # Preview du build
npm run lint     # Linting
```

---

**Auteur**: Équipe de développement  
**Version**: 2.0.0  
**Date**: 2024
