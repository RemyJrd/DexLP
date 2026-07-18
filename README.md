# DexLP

Tableau de bord public, en lecture seule, de la liquidité SushiSwap sur
Gnosis Chain.

Le MVP affiche l’état courant de la pool SushiSwap V2 **USDC/WXDAI** :

- liquidité totale estimée ;
- réserves on-chain et composition de la pool ;
- prix interne USDC/WXDAI et écart au peg ;
- supply du jeton LP ;
- nombre de détenteurs LP ;
- top 10 des détenteurs, leur part du supply et leur sous-jacent estimé ;
- bloc, horodatage et sources de chaque lecture.

Aucune connexion de wallet n’est nécessaire et l’application ne signe aucune
transaction.

## Pourquoi USDC/WXDAI ?

L’ancien README annonçait une pool SushiSwap USDC/DAI, mais l’audit on-chain a
mis en évidence trois problèmes :

1. l’adresse USDC documentée était erronée ;
2. l’adresse DAI documentée n’était pas celle du contrat DAI Gnosis ;
3. aucune pool SushiSwap USDC/DAI directe n’existe actuellement en V2 ou V3.

La pool réellement active et pertinente pour ce premier dashboard est :

| Élément | Adresse |
| --- | --- |
| Pool Sushi V2 USDC/WXDAI | `0xA227c72a4055A9DC949cAE24f54535fe890d3663` |
| USDC | `0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83` |
| WXDAI | `0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d` |
| Sushi V2 Factory | `0xC35DAdb65012eC5796536bD9864eD8773aBc74C4` |

## Sources de données

### Gnosis RPC

Les réserves, `token0`, `token1`, le supply LP et le bloc courant sont lus
directement sur Gnosis Chain avec `viem`.

- source principale : `https://rpc.gnosischain.com`
- fallback : `https://rpc.gnosis.gateway.fm`

Le RPC public Gnosis est gratuit mais sans SLA. Une erreur RPC produit un état
d’erreur explicite : aucune donnée fictive n’est injectée dans l’interface.

### Blockscout

Le top des détenteurs LP et le nombre total de holders proviennent de :

```text
GET https://gnosis.blockscout.com/api/v2/tokens/{PAIR_ADDRESS}/holders
GET https://gnosis.blockscout.com/api/v2/tokens/{PAIR_ADDRESS}
```

La réponse est adaptée côté serveur et mise en cache pendant cinq minutes afin
de limiter la pression sur l’API publique. Si Blockscout est indisponible, les
réserves RPC restent visibles et seule la section holders passe en mode
dégradé.

Un holder direct peut être un Safe, un farm ou un coffre qui agrège plusieurs
bénéficiaires économiques. Le tableau ne prétend donc pas identifier les
propriétaires finaux.

## Hypothèses de calcul

- `TVL estimée = réserve USDC + réserve WXDAI`
- `1 USDC = 1 USD`
- `1 WXDAI = 1 USD`
- `prix pool = réserve WXDAI / réserve USDC`
- `part LP = solde LP / totalSupply`
- `sous-jacent holder = réserve × part LP`

La TVL est volontairement qualifiée d’**estimée**. L’écart au peg décrit le
ratio interne de la pool, pas un prix oracle.

## Installation

Prérequis :

- Node.js 20.9 ou plus récent ;
- pnpm 11 recommandé.

```bash
pnpm install
pnpm dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).

L’application fonctionne sans fichier `.env`. Pour remplacer les endpoints
publics :

```bash
cp .env.example .env.local
```

Variables disponibles :

```bash
GNOSIS_RPC_URL=https://rpc.gnosischain.com
GNOSIS_RPC_FALLBACK_URL=https://rpc.gnosis.gateway.fm
BLOCKSCOUT_API_URL=https://gnosis.blockscout.com/api/v2
```

## Commandes

```bash
pnpm dev        # serveur de développement
pnpm lint       # ESLint
pnpm typecheck  # TypeScript strict
pnpm test       # tests unitaires Vitest
pnpm build      # build de production Next.js
pnpm start      # serveur de production après build
pnpm check      # lint + types + tests + build
```

## Architecture

```text
app/
├── (home)/page.tsx      # page principale
├── api/pool/route.ts    # endpoint agrégé RPC + Blockscout
├── globals.css          # design system et responsive
└── layout.tsx
components/
├── Icons.tsx
└── PoolDashboard.tsx    # chargement, refresh et vues du dashboard
lib/
├── abis.ts
├── pool-config.ts       # adresses et configuration
├── pool-data.ts         # adaptateurs RPC / Blockscout
├── pool-math.ts         # calculs purs bigint-safe
├── pool-math.test.ts
└── pool-types.ts
```

Le navigateur interroge `/api/pool` toutes les 30 secondes. La route serveur :

1. lit les données de la paire au RPC ;
2. normalise l’ordre `token0/token1` ;
3. récupère ou réutilise le cache Blockscout ;
4. calcule TVL, poids, peg, concentration et sous-jacents ;
5. sérialise les `bigint` en chaînes lorsque leur valeur brute est conservée.

## État de l’ancien prototype

L’audit initial a trouvé un squelette Next.js qui ne compilait pas :

- le dossier `lib/` entier était absent, car `.gitignore` ignorait `lib/` ;
- `getPair` était appelé sur le routeur au lieu de la factory ;
- les adresses et libellés USDC/DAI étaient incohérents ;
- WalletConnect était obligatoire même pour une vue en lecture seule ;
- l’historique NAV/IL répétait des valeurs sans nouvelle lecture RPC ;
- les formulaires add/remove n’étaient pas suffisamment fiables pour être
  exposés sans tests sur fork.

Ces surfaces d’écriture ont été retirées du MVP. Les routes historiques
`/wallet/[addr]` et `/lp` redirigent vers le dashboard.

## Limites et suite possible

Ce MVP est un **snapshot courant**, pas encore un produit d’analytics
historique. Les prochaines itérations naturelles sont :

1. historique TVL, volume et frais via le subgraph Sushi / The Graph ;
2. prix externes et détection de depeg via un oracle ou une API de prix ;
3. distinction plus fine entre détenteur LP direct et bénéficiaire final ;
4. sélection de plusieurs pools Gnosis ;
5. alertes de seuil et suivi de snapshots persistés ;
6. réintroduction éventuelle de la gestion de liquidité après tests sur fork,
   simulations et sécurisation des quotes/slippages.

## Références

- [Documentation Gnosis RPC](https://docs.gnosischain.com/tools/RPC%20Providers/)
- [Documentation Blockscout — token holders](https://docs.blockscout.com/api-reference/get-token-holders)
- [Pool sur Blockscout](https://gnosis.blockscout.com/address/0xA227c72a4055A9DC949cAE24f54535fe890d3663)
- [Pool sur Sushi](https://www.sushi.com/gnosis/pool/v2/0xA227c72a4055A9DC949cAE24f54535fe890d3663)

