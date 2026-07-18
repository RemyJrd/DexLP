# DexLP

Explorateur public, multi-chain et en lecture seule des principales pools de
liquidité EVM.

DexLP réunit deux niveaux d’analyse :

- un **catalogue comparable** de pools issues de plusieurs DEX et réseaux ;
- une **analyse on-chain complète** de la pool pilote SushiSwap V2
  USDC/WXDAI sur Gnosis.

Aucune connexion de wallet n’est nécessaire et l’application ne signe aucune
transaction.

## Fonctionnalités

### Catalogue multi-chain

La page d’accueil affiche des pools provenant de :

- Gnosis ;
- Ethereum ;
- Arbitrum ;
- Base ;
- Polygon ;
- Optimism (`OP Mainnet` dans la source).

Les DEX couverts incluent notamment Uniswap V2/V3/V4, SushiSwap, Curve,
Balancer, Aerodrome, PancakeSwap, QuickSwap, Camelot et Fluid.

L’interface propose :

- recherche par token, paire, protocole, identifiant ou adresse ;
- filtres par réseau, protocole et profil stable/volatile ;
- tri par TVL, volume 24 h, APY publié ou nom ;
- TVL et volumes 24 h / 7 jours ;
- APY total, APY de base, APY des rewards et variation sur sept jours ;
- fiches synthétiques dédiées pour chaque pool ;
- interface responsive sans scroll horizontal sur mobile.

Les filtres sont reflétés dans l’URL afin de pouvoir partager une sélection.

### Analyse complète Gnosis

La route
`/pools/gnosis/sushi-v2/usdc-wxdai` conserve l’analyse détaillée de la pool :

| Élément | Adresse |
| --- | --- |
| Pool Sushi V2 USDC/WXDAI | `0xA227c72a4055A9DC949cAE24f54535fe890d3663` |
| USDC | `0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83` |
| WXDAI | `0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d` |
| Sushi V2 Factory | `0xC35DAdb65012eC5796536bD9864eD8773aBc74C4` |

Elle affiche :

- réserves et supply LP directement depuis le RPC Gnosis ;
- TVL stablecoins estimée et composition ;
- prix interne USDC/WXDAI et écart au peg ;
- nombre de détenteurs LP ;
- top 10 des détenteurs et leur part du supply ;
- sous-jacent estimé de chaque détenteur ;
- bloc, horodatage et source de chaque lecture.

Cette pool est injectée séparément dans le catalogue, car DefiLlama Yields ne
la référence pas actuellement. Son APY reste donc indiqué comme indisponible :
aucun rendement n’est inventé.

## Sources de données

### DefiLlama Yields

Le catalogue utilise côté serveur :

```text
GET https://yields.llama.fi/pools
```

Le flux est volumineux et ne doit jamais être téléchargé directement par chaque
navigateur. DexLP le met en cache pendant une heure, le normalise, puis renvoie
au client au maximum 40 pools par réseau.

Règles d’éligibilité :

- réseau et DEX dans les listes supportées ;
- exposition multi-actifs ;
- au moins deux tokens sous-jacents publiés ;
- TVL supérieure ou égale à 10 000 USD ;
- exclusion des valeurs signalées comme outliers par la source ;
- classement par TVL au sein de chaque réseau.

Les valeurs sont celles publiées par DefiLlama :

- `apyBase` : rendement de base, généralement les frais pour un DEX ;
- `apyReward` : incentives en tokens ;
- `apy` : rendement total publié ;
- `apyPct7D` : variation absolue de l’APY en points de pourcentage.

Ces valeurs ne sont pas renommées en APR. Elles peuvent être nulles et
n’intègrent pas automatiquement l’impermanent loss, le gas, le slippage ou la
fiscalité.

Le service public DefiLlama ne fournit pas de SLA. Si celui-ci est indisponible,
le catalogue passe en mode dégradé et la pool pilote Gnosis reste accessible.

### Gnosis RPC

Les réserves, `token0`, `token1`, le supply LP et le bloc courant sont lus avec
`viem`.

- source principale : `https://rpc.gnosischain.com`
- fallback : `https://rpc.gnosis.gateway.fm`

### Blockscout

Les détenteurs LP proviennent de :

```text
GET https://gnosis.blockscout.com/api/v2/tokens/{PAIR_ADDRESS}/holders
GET https://gnosis.blockscout.com/api/v2/tokens/{PAIR_ADDRESS}
```

Les réponses sont adaptées côté serveur et mises en cache cinq minutes. Un
holder direct peut être un Safe, un farm ou un coffre qui agrège plusieurs
bénéficiaires économiques.

## Routes

| Route | Description |
| --- | --- |
| `/` | Explorateur multi-chain filtrable |
| `/pools/[poolId]` | Fiche synthétique d’une pool DefiLlama |
| `/pools/gnosis/sushi-v2/usdc-wxdai` | Analyse on-chain complète Gnosis |
| `/api/pools` | Catalogue multi-chain normalisé |
| `/api/pool` | Snapshot on-chain de la pool pilote |

Filtres serveur disponibles sur `/api/pools` :

```text
?id={poolId}
?chain={chain}
?project={dexSlug}
```

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
DEFILLAMA_YIELDS_URL=https://yields.llama.fi/pools
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
├── (home)/page.tsx
├── api/
│   ├── pool/route.ts
│   └── pools/route.ts
├── pools/
│   ├── [poolId]/page.tsx
│   └── gnosis/sushi-v2/usdc-wxdai/page.tsx
├── globals.css
└── layout.tsx
components/
├── Icons.tsx
├── PoolDashboard.tsx
└── PoolExplorer.tsx
lib/
├── abis.ts
├── catalog-data.ts
├── catalog-normalize.ts
├── catalog-normalize.test.ts
├── catalog-types.ts
├── pool-config.ts
├── pool-data.ts
├── pool-math.ts
├── pool-math.test.ts
└── pool-types.ts
```

## Tests et garanties

La suite couvre notamment :

- conversion bigint-safe des réserves et parts LP ;
- normalisation des valeurs nulles ;
- rejet des chaînes et protocoles non supportés ;
- exclusion des outliers, pools mono-actif et TVL insuffisantes ;
- quota par réseau afin de ne pas masquer les plus petites chaînes ;
- filtres d’identifiant exacts.

Le navigateur a été validé sur les parcours catalogue, filtres combinés,
fiches synthétiques et détail Gnosis, avec vérification responsive à 320 px.

## Limites et prochaines étapes

Cette version fournit des snapshots et des indicateurs agrégés. Les évolutions
naturelles sont :

1. historique TVL/APY/volume avec graphiques 7 et 30 jours ;
2. persistance d’un dernier snapshot valide et requêtes conditionnelles ETag ;
3. adaptateurs on-chain détaillés pour d’autres réseaux et protocoles ;
4. holders LP sur les pools disposant d’un token LP canonique ;
5. estimation de l’impermanent loss d’une position ;
6. comparaison côte à côte et watchlist locale ;
7. vue facultative des positions d’un wallet, toujours séparée du catalogue
   public.

## Références

- [Méthodologie DefiLlama Yields](https://github.com/DefiLlama/yield-server#apy-methodology)
- [Schéma des adaptateurs DefiLlama](https://github.com/DefiLlama/yield-server)
- [Documentation Gnosis RPC](https://docs.gnosischain.com/tools/RPC%20Providers/)
- [Documentation Blockscout — token holders](https://docs.blockscout.com/api-reference/get-token-holders)
- [Pool pilote sur Blockscout](https://gnosis.blockscout.com/address/0xA227c72a4055A9DC949cAE24f54535fe890d3663)
