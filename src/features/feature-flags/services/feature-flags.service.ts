import { apiClient } from '@/shared/api/client';

// Public, unauthenticated endpoint — see the orchestrator's
// FeatureFlagsController. Flat { "<key>": boolean } map; unknown keys are
// simply absent, never an error.
export type FeatureFlags = Record<string, boolean>;

export const featureFlagsService = {
  get: async (): Promise<FeatureFlags> => {
    const { data } = await apiClient.get<FeatureFlags>('/feature-flags');
    return data;
  },
};
