import { notFound } from "next/navigation";
import { coinPairParamsSchema } from "@/services/dexscreener-data";
import { CoinDetail } from "@/features/coins/coin-detail";

export default async function CoinDetailPage({ params }) {
  const result = coinPairParamsSchema.safeParse(await params);
  if (!result.success) notFound();
  return <CoinDetail key={`${result.data.chain}:${result.data.pair}`} chain={result.data.chain} pair={result.data.pair} />;
}
