export type ScoutingPolicy = {
  id: string;
  text: string;
};

function tokenise(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

export function rankPolicies(
  query: string,
  policies: readonly ScoutingPolicy[],
): ScoutingPolicy[] {
  const queryTerms = [...new Set(tokenise(query))];

  return policies
    .map((policy) => {
      const policyTerms = new Set(tokenise(policy.text));
      const score = queryTerms.filter((term) => {
        if(policyTerms.has(term)) {
            return true;
        }
      }).length;

      return { policy, score };
    })
    .filter((term) => {
        return term.score > 0;
    })
    .sort((a, b) => b.score - a.score)
    .map(({ policy }) => policy);
}