import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68f8348c759c6747fbec92ad", 
  requiresAuth: true // Ensure authentication is required for all operations
});
