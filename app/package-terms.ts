export const packageTerms = {
  "Single Package": { price: "£95", gameCount: 1 },
  "Night Package": { price: "£160", gameCount: 2 },
  "Full House Package": { price: "£200", gameCount: 3 },
} as const;

export function getPackageTerms(name: string) {
  return Object.hasOwn(packageTerms, name) ? packageTerms[name as keyof typeof packageTerms] : undefined;
}

export const securityDepositPence = 25_000;

export function parsePriceInPence(value: string) {
  if (!/^\d{1,5}(?:\.\d{1,2})?$/.test(value)) return null;
  const [pounds, pence = ""] = value.split(".");
  return Number(pounds) * 100 + Number(pence.padEnd(2, "0"));
}
