import { z } from "zod/v4";
import type { BancolombiaConfig } from "../schemas/config";
import { TransactionSchema, type Transaction } from "../schemas/transaction";
import { BancolombiaTransactionsResponseSchema } from "../schemas/bancolombia";
import { get, post } from "../http";
import { TRANSACTIONS_PATH } from "../constants";

export async function getTransactions(
  accountId: string,
  from: string,
  to: string,
  config: BancolombiaConfig
): Promise<Transaction[]> {
  if (config.mode === "direct") {
    const json = await post(
      TRANSACTIONS_PATH,
      {
        account: { number: accountId, type: "CUENTA_DE_AHORRO" },
        pagination: { key: 1 },
        filter: {
          dateFrom: from.replace(/-/g, "/"),
          dateTo: to.replace(/-/g, "/"),
          description: "",
        },
      },
      config,
      BancolombiaTransactionsResponseSchema,
    );

    return json.data.transactions.map((tx, i) => {
      const isCredit = tx.type === "DEBITO";
      const date = tx.transactionDate.replace(/\//g, "-") + "T00:00:00.000Z";

      return TransactionSchema.parse({
        id: `${accountId}-${date}-${Math.abs(tx.amount)}-${i}`,
        accountId,
        bankId: "bancolombia",
        date,
        description: tx.description,
        amount: tx.amount,
        type: isCredit ? "credit" : "debit",
        reference: tx.reference1 || undefined,
      });
    });
  }

  const params = new URLSearchParams({ accountId, from, to });
  return get(`/transactions?${params}`, config, z.array(TransactionSchema));
}
