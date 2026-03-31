import { z } from "zod/v4";

// Raw Bancolombia API response schemas

export const BancolombiaAccountSchema = z.object({
  type: z.string(),
  number: z.string(),
  name: z.string(),
  currency: z.string().default("COP"),
  balances: z.object({
    available: z.number(),
  }),
});

export const BancolombiaAccountsResponseSchema = z.object({
  data: z.object({
    accounts: z.array(BancolombiaAccountSchema),
  }),
});

export const BancolombiaTransactionSchema = z.object({
  transactionDate: z.string(),
  description: z.string(),
  amount: z.number(),
  type: z.string(),
  reference1: z.string().nullable().optional(),
});

export const BancolombiaTransactionsResponseSchema = z.object({
  data: z.object({
    transactions: z.array(BancolombiaTransactionSchema),
  }),
});
