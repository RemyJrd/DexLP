import { WalletDashboard } from "../../../components/WalletDashboard";

export const dynamic = 'force-dynamic';

interface Params {
  params: {
    addr: string;
  };
}

export default function WalletPage({ params }: Params) {
  return <WalletDashboard address={params.addr} />;
}
