import coreWebVitals from 'eslint-config-next/core-web-vitals';

// ESLint 9 requires flat config and Next 16 removed `next lint`, so we run ESLint
// directly (`eslint .`). This mirrors the project's original lint scope
// (`next/core-web-vitals`) using eslint-config-next v16's flat-config array.
const eslintConfig = [
  ...coreWebVitals,
  {
    rules: {
      'react/display-name': 'warn',
      'react/prop-types': 'warn',
      // These two rules are brand-new in eslint-config-next v16 (React Compiler
      // era). The existing code predates them; keep them as advisory warnings
      // rather than failing CI on a pre-existing, repo-wide pattern.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
