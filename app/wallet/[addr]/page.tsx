import { WalletDashboard } from "../../../components/WalletDashboard";

interface Params {
  params: {
    addr: string;
  };
}

export default function WalletPage({ params }: Params) {
  return <WalletDashboard address={params.addr} />;
}
