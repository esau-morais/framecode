typescript
import * as crypto from 'crypto';
import { Request, Response } from 'express'; // Assuming Express.js context for typical web server handling

// This secret must be securely loaded from environment variables in a production environment.
// NEVER hardcode secrets directly in your codebase.
const POLAR_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET;

// Tolerance for timestamp verification to prevent replay attacks (e.g., 5 minutes)
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * Interface for a service that interacts with the application's database
 * to manage user subscriptions and usage data.
 */
interface UserService {
  /**
   * Updates a user's subscription status and associated feature limits.
   * @param userId The internal ID of the user.
   * @param tier The name of the subscription tier (e.g., 'Free', 'Pro', 'Team').
   * @param status The subscription status (e.g., 'active', 'inactive', 'canceled').
   * @param limits An object containing feature limits (e.g., video count, rendering features).
   */
  updateUserSubscription: (userId: string, tier: string, status: string, limits: any) => Promise<void>;

  /**
   * Updates a user's usage data. This might be called for events related to usage billing.
   * @param userId The internal ID of the user.
   * @param usageData An object containing details about the user's usage.
   */
  updateUserUsage: (userId: string, usageData: any) => Promise<void>;

  /**
   * Retrieves the internal userId from a Polar.sh subscriber ID.
   * In a real application, this would query your database to map Polar's `subscriber_id`
   * to your internal `userId`.
   * @param polarId The subscriber ID provided by Polar.sh.
   * @returns The internal user ID, or null if not found.
   */
  getInternalUserIdFromPolarId: (polarId: string) => Promise<string | null>;
}

// A mock UserService for demonstration purposes.
// In a real application, this would interact with your database (e.g., Prisma, TypeORM, Mongoose).
const userService: UserService = {
  updateUserSubscription: async (userId, tier, status, limits) => {
    // Simulate database update
    await new Promise(resolve => setTimeout(resolve, 50));
  },
  updateUserUsage: async (userId, usageData) => {
    // Simulate database update
    await new Promise(resolve => setTimeout(resolve, 50));
  },
  getInternalUserIdFromPolarId: async (polarId: string) => {
    // In a real app, query your database to map Polar's subscriber_id to your internal user ID.
    // For this example, we assume `polarId` directly maps to `userId`.
    await new Promise(resolve => setTimeout(resolve, 20));
    return polarId; // Assuming direct mapping for mock
  }
};

/**
 * Verifies a webhook signature strictly following the Svix standard.
 *
 * CORE LESSON 3:
 * BẮT BUỘC tuân thủ chuẩn Svix (Standard Webhooks):
 * Sử dụng chính xác tên header là 'webhook-signature',
 * định dạng chuỗi mã hóa payload phải theo cấu trúc nghiêm ngặt: `msg_id.timestamp.payload`.
 *
 * @param payload The raw request body as a string.
 * @param signatureHeader The value of the 'webhook-signature' header.
 * @param timestampHeader The value of the 'webhook-timestamp' header.
 * @param idHeader The value of the 'webhook-id' header.
 * @returns True if the signature is valid, false otherwise.
 */
async function verifySvixSignature(
  payload: string,
  signatureHeader: string | undefined,
  timestampHeader: string | undefined,
  idHeader: string | undefined,
  secret: string
): Promise<boolean> {
  if (!signatureHeader || !timestampHeader || !idHeader) {
    // In a production environment, this would be logged via a proper logging system.
    // console.error('Missing required Svix webhook headers (webhook-signature, webhook-timestamp, webhook-id).');
    return false;
  }

  const parts = signatureHeader.split(',');
  const signature = parts.find(p => p.startsWith('v1='))?.substring(3);

  if (!signature) {
    // console.error('Invalid signature format: v1= part not found.');
    return false;
  }

  // The content that was signed: `msg_id.timestamp.payload`
  const signedContent = `${idHeader}.${timestampHeader}.${payload}`;

  // Svix secrets are typically base64 encoded.
  const secretBuffer = Buffer.from(secret, 'base64');

  // Compute the expected signature using HMAC-SHA256
  const expectedSignature = crypto.createHmac('sha256', secretBuffer)
                                  .update(signedContent)
                                  .digest('base64'); // Svix typically uses base64 output for the signature

  // Prevent replay attacks: check timestamp tolerance.
  const receivedTimestamp = parseInt(timestampHeader, 10) * 1000;
  if (isNaN(receivedTimestamp) || Math.abs(Date.now() - receivedTimestamp) > TIMESTAMP_TOLERANCE_MS) {
    // console.warn('Webhook timestamp is outside of the allowed tolerance or invalid. Possible replay attack.');
    return false;
  }

  // Compare signatures using a timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Main webhook handler for Polar.sh events.
 * This function processes incoming webhook requests, verifies their authenticity,
 * and dispatches actions based on the event type.
 *
 * @param req The Express Request object.
 * @param res The Express Response object.
 */
export const handlePolarWebhook = async (req: Request, res: Response) => {
  // In Express, you need middleware like `express.raw({ type: 'application/json' })`
  // placed BEFORE this handler to get the raw body for signature verification.
  // Example: `app.post('/api/webhooks/polar', express.raw({ type: 'application/json' }), handlePolarWebhook);`
  const rawBody = (req as any).rawBody?.toString('utf8');

  if (!rawBody) {
    // console.error('Raw body not available for webhook signature verification. Ensure middleware is configured.');
    return res.status(400).send('Bad Request: Raw body missing.');
  }

  const signature = req.headers['webhook-signature'] as string | undefined;
  const timestamp = req.headers['webhook-timestamp'] as string | undefined;
  const id = req.headers['webhook-id'] as string | undefined;

  if (!POLAR_WEBHOOK_SECRET) {
    // console.error('Polar webhook secret is not configured in environment variables. Aborting verification.');
    return res.status(500).send('Webhook secret not configured.');
  }

  // Verify the webhook signature using the Svix standard
  const isSignatureValid = await verifySvixSignature(rawBody, signature, timestamp, id, POLAR_WEBHOOK_SECRET);

  if (!isSignatureValid) {
    // console.warn('Invalid webhook signature. Request rejected.');
    return res.status(401).send('Invalid signature');
  }

  try {
    const event = JSON.parse(rawBody); // Parse the raw body after verification

    // Handle different Polar.sh event types
    switch (event.type) {
      case 'subscription.created':
      case 'subscription.updated':
        await handleSubscriptionEvent(event);
        break;
      case 'subscription.canceled':
        await handleSubscriptionCanceledEvent(event);
        break;
      case 'invoice.paid':
        // This event could be used to trigger usage updates or confirm billing cycles
        await handleInvoicePaidEvent(event);
        break;
      case 'issue_pledge.created':
      case 'issue_pledge.updated':
      case 'issue_pledge.confirmed':
        // Handle funding related events if applicable to your application logic.
        // E.g., rewarding users who created pledges or updating project statuses.
        // await handlePledgeEvent(event); // Uncomment and implement if needed
        break;
      default:
        // Gracefully ignore unhandled events. In production, you might log this
        // through a proper logging system for monitoring.
        break;
    }

    res.status(200).send('OK');
  } catch (error) {
    // console.error('Error processing Polar.sh webhook:', error);
    res.status(500).send('Internal Server Error');
  }
};

/**
 * Handles 'subscription.created' and 'subscription.updated' events from Polar.sh.
 * Updates the user's subscription status and feature limits in the database.
 * @param event The Polar.sh webhook event object.
 */
async function handleSubscriptionEvent(event: any) {
  const { subscription, tier } = event.payload; // Polar.sh events typically have a 'payload' object
  if (!subscription || !tier) {
    // console.error('Subscription or Tier data missing in event payload for subscription event:', event);
    return;
  }

  // Map Polar's subscriber_id to your internal user ID.
  const internalUserId = await userService.getInternalUserIdFromPolarId(subscription.subscriber_id);
  if (!internalUserId) {
    // console.error(`User not found in internal system for Polar subscriber ID: ${subscription.subscriber_id}`);
    return;
  }

  const subscriptionId = subscription.id;
  const subscriptionStatus = subscription.current_state; // e.g., 'active', 'inactive', 'canceled', 'trialing'

  let appTierName = 'Free';
  let videoLimit = 0;
  let cloudRenderingEnabled = false;
  let priorityLambda = false;

  // Map Polar.sh tier slugs/IDs to your application's internal tier structure and features.
  switch (tier.slug) { // Assuming 'slug' is used to identify the tier in Polar.sh
    case 'pro-tier': // This slug must match your Polar.sh product tier slug for 'Pro'
      appTierName = 'Pro';
      videoLimit = 1000;
      cloudRenderingEnabled = true;
      break;
    case 'team-tier': // This slug must match your Polar.sh product tier slug for 'Team'
      appTierName = 'Team';
      videoLimit = 10000;
      cloudRenderingEnabled = true;
      priorityLambda = true;
      break;
    default:
      appTierName = 'Free'; // Default to free if tier is not recognized or is a free tier in Polar.sh
      break;
  }

  // Update user subscription status and limits in the database
  await userService.updateUserSubscription(internalUserId, appTierName, subscriptionStatus, {
    polarSubscriptionId: subscriptionId,
    videoLimit,
    cloudRenderingEnabled,
    priorityLambda,
    // Add other relevant subscription details from event.payload as needed
  });
}

/**
 * Handles 'subscription.canceled' events from Polar.sh.
 * Updates the user's subscription status to 'Free' or 'inactive' and removes paid features.
 * @param event The Polar.sh webhook event object.
 */
async function handleSubscriptionCanceledEvent(event: any) {
  const { subscription } = event.payload;
  if (!subscription) {
    // console.error('Subscription data missing in cancellation event payload:', event);
    return;
  }

  const internalUserId = await userService.getInternalUserIdFromPolarId(subscription.subscriber_id);
  if (!internalUserId) {
    // console.error(`User not found in internal system for Polar subscriber ID: ${subscription.subscriber_id}`);
    return;
  }

  const subscriptionId = subscription.id;

  // Set user to 'Free' tier and remove all paid features.
  // The status is 'canceled' in the database, but effectively they have 'Free' tier features.
  await userService.updateUserSubscription(internalUserId, 'Free', 'canceled', {
    polarSubscriptionId: subscriptionId,
    videoLimit: 0,
    cloudRenderingEnabled: false,
    priorityLambda: false,
  });
}

/**
 * Handles 'invoice.paid' events from Polar.sh.
 * This is where usage billing could be processed, or usage counters reset for new billing cycles.
 * @param event The Polar.sh webhook event object.
 */
async function handleInvoicePaidEvent(event: any) {
  const { invoice, subscription } = event.payload;
  if (!invoice || !subscription) {
    // console.error('Invoice or Subscription data missing in invoice.paid event payload:', event);
    return;
  }

  const internalUserId = await userService.getInternalUserIdFromPolarId(subscription.subscriber_id);
  if (!internalUserId) {
    // console.error(`User not found in internal system for Polar subscriber ID: ${subscription.subscriber_id}`);
    return;
  }

  // Example: Reset usage counters for the user or update their current usage.
  // This depends heavily on how your usage billing model is structured.
  await userService.updateUserUsage(internalUserId, {
    lastInvoicePaidAt: new Date(invoice.paid_at),
    // If your application has per-billing-cycle usage limits, you might reset them here:
    // currentVideoCount: 0,
  });
}