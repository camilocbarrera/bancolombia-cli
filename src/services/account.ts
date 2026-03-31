import { z } from "zod/v4";
import type { BancolombiaConfig } from "../schemas/config";
import { AccountSchema, type Account } from "../schemas/account";
import { BancolombiaAccountsResponseSchema } from "../schemas/bancolombia";
import { get } from "../http";
import { ACCOUNTS_PATH } from "../constants";

export async function getAccounts(config: BancolombiaConfig): Promise<Account[]> {
  if (config.mode === "direct") {
    const json = await get(ACCOUNTS_PATH, config, BancolombiaAccountsResponseSchema);

    return json.data.accounts.map((acc) => {
      let type: "savings" | "checking" | "credit_card" = "savings";
      if (acc.type === "CUENTA_CORRIENTE") type = "checking";
      else if (acc.type.includes("TARJETA") || acc.type.includes("CREDIT"))
        type = "credit_card";

      return AccountSchema.parse({
        id: acc.number,
        bankId: "bancolombia",
        number: acc.number,
        name: acc.name,
        type,
        balance: acc.balances.available,
        currency: acc.currency,
      });
    });
  }

  return get("/accounts", config, z.array(AccountSchema));
}
