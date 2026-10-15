import { Wallet } from "@/models/wallet";
import { authorizeWalletWrite, parseWalletBody, serializeWallet, walletFailure, walletJson } from "@/lib/wallet-api";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const auth = await authorizeWalletWrite(request);
    if (auth.error) return auth.error;
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/i.test(id)) return walletJson({ error: "Invalid wallet ID." }, 400);
    const body = await parseWalletBody(request, true);
    if (body.error) return body.error;
    await Wallet.createIndexes();
    const wallet = await Wallet.findByIdAndUpdate(id, { $set: body.data }, { returnDocument: "after", runValidators: true });
    if (!wallet) return walletJson({ error: "Wallet not found." }, 404);
    return walletJson({ wallet: serializeWallet(wallet) });
  } catch (error) { return walletFailure(error); }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await authorizeWalletWrite(request);
    if (auth.error) return auth.error;
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/i.test(id)) return walletJson({ error: "Invalid wallet ID." }, 400);
    const wallet = await Wallet.findByIdAndDelete(id);
    if (!wallet) return walletJson({ error: "Wallet not found." }, 404);
    return walletJson({ deletedId: id });
  } catch (error) { return walletFailure(error); }
}
