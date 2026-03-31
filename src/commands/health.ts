import { PROXY_API_URL } from "../constants";
import { printDetail, withSpinner, success, fail } from "../ui";

const apiUrl = process.argv[2] || PROXY_API_URL;

try {
  const res = await withSpinner("Checking API health...", async () => {
    const r = await fetch(`${apiUrl}/health`);
    if (!r.ok) throw new Error(`Status ${r.status}`);
    return r.json() as Promise<{ status: string; timestamp: string }>;
  });
  printDetail("API Health", [
    ["URL", apiUrl],
    ["Status", success(res.status)],
    ["Timestamp", res.timestamp],
  ]);
} catch (err: any) {
  printDetail("API Health", [
    ["URL", apiUrl],
    ["Status", fail("Unreachable")],
    ["Error", err.message],
  ]);
  process.exit(1);
}
