export type UserRole = 'customer' | 'provider' | 'admin';

export type UserStatus = 'active' | 'blocked' | 'suspended';

export interface LocationCoords {
  lat: number;
  lng: number;
  address: string;
  city?: string;
}

export interface IdVerificationData {
  status: 'unverified' | 'pending' | 'pending_approval' | 'verified' | 'rejected';
  documentType: 'national_id' | 'passport' | 'drivers_license' | 'business_permit';
  documentNumber: string;
  fullName: string;
  dob?: string;
  country: string;
  address?: string;
  photoUrl?: string;
  documentImage?: string; // Direct file upload base64
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  status: UserStatus;
  verified: boolean;
  identityVerified?: boolean;
  walletStatus?: 'pending_approval' | 'active' | 'suspended';
  idVerification?: IdVerificationData;
  preferredCurrency?: string;
  emailVerified?: boolean;
  rememberMe?: boolean;
  location?: LocationCoords;
  createdAt: string;
  walletBalance: number;
  walletAddress?: string;
  rating?: number;
  totalJobs?: number;
  completedLoyaltyServices?: number; // 0 to 15, resets upon free service
  freeServicesEarned?: number;
  milestoneBonusJobs?: number; // tracks 10, 20
  totalBonusesEarned?: number;
  bio?: string;
  businessName?: string;
}

export interface ProviderStorefront {
  enabled: boolean;
  subdomain: string; // e.g. "chef-mario" -> https://chef-mario.servexa.com
  storeName: string;
  tagline?: string;
  bio?: string;
  bannerUrl?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  themeColor?: string;
  currency?: string;
  subscriptionActive: boolean;
  monthlyFee: number; // 5.00
  subscriptionRenewsAt?: string;
  customDomain?: string;
  analytics?: {
    views: number;
    orders: number;
    revenue: number;
  };
}

export interface ProviderPaymentGateway {
  mode: 'servexa_escrow' | 'custom_merchant';
  processor?: 'stripe' | 'paypal' | 'square' | 'custom_bank';
  merchantId?: string;
  publishableKey?: string;
  secretKeyMasked?: string;
  settlementCurrency?: string;
  isVerified?: boolean;
  lastTestedAt?: string;
  autoDisburse?: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  priceType: 'fixed' | 'hourly' | 'km' | 'quote';
  durationMinutes?: number;
  description: string;
  imageUrl?: string;
  images?: string[];
}

export interface PortfolioPost {
  id: string;
  providerId: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  likes: number;
  serviceCategory: string;
  createdAt: string;
}

export interface ProviderProfile {
  userId: string;
  handle: string;
  businessName: string;
  category: string;
  subcategories: string[];
  bio: string;
  serviceArea: string;
  workingHours: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  isVerified: boolean;
  activeStatus: 'online' | 'busy' | 'offline';
  currentLocation: LocationCoords;
  heading?: number;
  services: ServiceItem[];
  posts: PortfolioPost[];
  hourlyRate?: number;
  storefront?: ProviderStorefront;
  paymentGateway?: ProviderPaymentGateway;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  pricingModels: ('fixed' | 'hourly' | 'km' | 'quote')[];
  subcategories: { id: string; name: string }[];
  basePrice: number;
  characterImage?: string;
  characterAction?: string;
  characterWorkplace?: string;
}

export type BookingStatus =
  | 'requested'
  | 'pending'
  | 'accepted'
  | 'confirmed'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'declined';

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAvatar?: string;
  providerId: string;
  providerName: string;
  providerAvatar?: string;
  serviceName: string;
  categoryId: string;
  bookingType: 'instant' | 'scheduled' | 'quote';
  pricingModel: 'fixed' | 'hourly' | 'km' | 'quote';
  status: BookingStatus;
  pickupLocation: LocationCoords;
  destinationLocation?: LocationCoords;
  scheduledTime?: string;
  price: number;
  commissionFee: number;
  providerEarnings: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: 'card' | 'wallet';
  cancellationReason?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  deliveryPin?: string;
  deliveryVerified?: boolean;
  deliveredAt?: string;
  providerCurrentLocation?: { lat: number; lng: number; address?: string };
  source?: 'marketplace' | 'storefront';
  storefrontSubdomain?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  bookingId?: string;
  amount: number;
  type: 'payment' | 'payout' | 'commission' | 'refund' | 'bonus' | 'deposit' | 'withdrawal' | 'subscription';
  status: 'succeeded' | 'pending' | 'failed';
  description: string;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  providerId: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  rating: number;
  comment: string;
  photos?: string[];
  providerReply?: string;
  createdAt: string;
  reported?: boolean;
}

export interface Product {
  id: string;
  providerId: string;
  providerName?: string;
  storeName?: string;
  subdomain?: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  category: string;
  image?: string;
  imageUrl?: string;
  inStock?: boolean;
  rating?: number;
  salesCount?: number;
}

export type StoreProduct = Product;

export interface ChatInvoiceItem {
  id: string;
  description: string;
  amount: number;
}

export interface ChatInvoice {
  id: string;
  bookingId?: string;
  conversationId?: string;
  providerId: string;
  providerName: string;
  customerId: string;
  customerName: string;
  laborAmount: number;
  materialsAmount: number;
  consultationFee: number; // $1.00 fixed captured by admin
  commissionFee: number; // 6% from provider
  platformFeePercent?: number; // 6%
  platformFeeAmount?: number;
  totalAmount: number; // labor + materials + consultationFee
  providerEarnings: number; // (labor + materials) - 6% commission
  notes?: string;
  status: 'pending' | 'paid' | 'confirmed' | 'cancelled';
  paidAt?: string;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: string;
}

export interface EmailSettings {
  resendApiKey: string;
  resendSenderEmail: string;
  resendVerified: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword?: string;
  smtpSecure: boolean;
  smtpVerified: boolean;
  lastDispatchedEmail?: {
    to: string;
    subject: string;
    service: 'resend' | 'smtp';
    timestamp: string;
  };
}

export interface ProviderPayout {
  id: string;
  providerId: string;
  providerName: string;
  amount: number;
  status: 'processing' | 'scheduled' | 'disbursed' | 'failed';
  requestedAt: string;
  estimatedArrivalMinHours: number; // 24
  estimatedArrivalMaxHours: number; // 48
  scheduledDisbursementAt: string; // 24-48 hours window
  disbursedAt?: string;
  payoutMethod: 'stripe_connect' | 'paypal' | 'bank_wire';
  referenceNumber: string;
}

export interface ChatMessage {
  id: string;
  bookingId?: string;
  conversationId?: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  text: string;
  mediaType?: 'text' | 'image' | 'video' | 'invoice' | 'location';
  mediaUrl?: string;
  invoice?: ChatInvoice;
  location?: LocationCoords;
  timestamp: string;
  read: boolean;
  isEncrypted?: boolean;
}

export interface PBXCall {
  id: string;
  callerId: string;
  callerName: string;
  callerRole: UserRole;
  calleeId: string;
  calleeName: string;
  calleeRole: UserRole;
  bookingId?: string;
  callType?: 'audio' | 'video';
  status: 'ringing' | 'connected' | 'ended' | 'rejected' | 'missed';
  startedAt?: string;
  endedAt?: string;
  durationSeconds: number;
  codec: string;
  bitrateKbps: number;
  packetLossPct: number;
  jitterMs: number;
  isEncrypted: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'call' | 'system' | 'security';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetUserId?: string;
  targetName?: string;
  details: string;
  timestamp: string;
}

export type AdminAuditLog = AuditLog;
export type ServiceCategory = Category;
export type Transaction = WalletTransaction;

export interface PlatformSettings {
  commissionRatePct: number;
  autoApproveProviders: boolean;
  pbxCodec: string;
  maxVoIPBitrateKbps: number;
  emergencyDispatchEnabled: boolean;
}

export interface PlatformStats {
  totalCustomers: number;
  totalProviders: number;
  activeUsers: number;
  activeProviders: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  gmvTotal: number;
  platformRevenue: number;
  providerPayouts: number;
  commissionRatePct: number;
  systemHealth: 'optimal' | 'degraded' | 'maintenance';
}

export interface MerchantSettings {
  activeGateway: 'stripe' | 'paypal' | 'square' | 'bank_direct';
  environment: 'sandbox' | 'live';
  stripe: {
    publishableKey: string;
    secretKeyConfigured: boolean;
    secretKeyPreview?: string;
    webhookSecretConfigured: boolean;
    connectClientId?: string;
    autoPayouts: boolean;
  };
  paypal: {
    clientId: string;
    secretConfigured: boolean;
    secretPreview?: string;
  };
  square: {
    appId: string;
    accessTokenConfigured: boolean;
    locationId?: string;
  };
  bankSettlement: {
    merchantId: string;
    bankName: string;
    accountLast4: string;
    routingNumber: string;
  };
  directCardProcessingEnabled: boolean;
}

export interface ComplaintMessage {
  id: string;
  complaintId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'provider' | 'admin';
  text: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  bookingId?: string;
  serviceName?: string;
  userId: string;
  userName: string;
  userRole: 'customer' | 'provider';
  targetUserId?: string;
  targetUserName?: string;
  subject: string;
  category: 'service_quality' | 'driver_location' | 'billing_overcharge' | 'damage_claim' | 'cancellation_fee' | 'other';
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  disputeAmount?: number;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  messages: ComplaintMessage[];
}

export interface RealtimeEvent {
  type:
    | 'USER_STATUS_UPDATED'
    | 'BOOKING_CREATED'
    | 'BOOKING_UPDATED'
    | 'CHAT_MESSAGE'
    | 'INVOICE_CREATED'
    | 'INVOICE_PAID'
    | 'PAYOUT_UPDATED'
    | 'PRODUCT_PURCHASED'
    | 'DISPATCH_REQUESTED'
    | 'DISPATCH_ACCEPTED'
    | 'NOTIFICATION_RECEIVED'
    | 'PBX_CALL_INVITE'
    | 'PBX_CALL_ANSWER'
    | 'PBX_CALL_REJECT'
    | 'PBX_CALL_HANGUP'
    | 'NOTIFICATION'
    | 'PROVIDER_LOCATION_UPDATED'
    | 'SETTINGS_UPDATED'
    | 'WALLET_UPDATED'
    | 'COMPLAINT_CREATED'
    | 'COMPLAINT_UPDATED'
    | 'COMPLAINT_MESSAGE'
    | 'LOCATION_UPDATE'
    | 'MERCHANT_SETTINGS_UPDATED'
    | 'STOREFRONT_UPDATED'
    | 'PROVIDER_GATEWAY_UPDATED'
    | 'DELIVERY_VERIFIED'
    | 'USER_PROFILE_UPDATED'
    | 'PROVIDER_PROFILE_UPDATED'
    | 'PROVIDER_SERVICE_ADDED';
  payload: any;
}
