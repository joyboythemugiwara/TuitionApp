import { PostHog } from 'posthog-node'

export const posthog = new PostHog(
  process.env.POSTHOG_API_KEY || 'phc_dummy_key',
  { host: process.env.POSTHOG_HOST || 'https://us.i.posthog.com' }
)
