"use client";

import { useAccount } from "wagmi";
import { useLpPosition } from "../hooks/useLpPosition";
import { AddLiquidityForm } from "./AddLiquidityForm";
import { RemoveLiquidityForm } from "./RemoveLiquidityForm";

export function LpManager() {
  const { address } = useAccount();
  const position = useLpPosition(address ?? undefined);
  const { refetch } = position;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <AddLiquidityForm onSettled={refetch} />
      <RemoveLiquidityForm
        pair={position.pair}
        lpBalance={position.lpBalance}
        totalSupply={position.totalSupply}
        reserves={position.reserves}
        rawReserves={position.rawReserves}
        onSettled={refetch}
      />
    </div>
  );
}
