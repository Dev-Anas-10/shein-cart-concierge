export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export type OrderStatus =
  | 'PENDING_APPROVAL'          // Submitted by user, awaiting admin review
  | 'REJECTED'                  // Rejected by admin
  | 'APPROVED_PENDING_PAYMENT'  // Approved by admin, waiting for user to pay
  | 'PAYMENT_UNDER_REVIEW'      // User submitted InstaPay/Vodafone Cash proof, admin reviewing
  | 'PAID'                      // Payment verified by admin, items being purchased
  | 'PROCESSING'                // Items purchased from SHEIN
  | 'SHIPPED'                   // In transit to delivery address
  | 'COMPLETED';                // Delivered

export type ItemStatus = 'available' | 'out_of_stock' | 'price_changed' | 'approved';

export interface GoodItem {
  id: string;
  name: string;
  image: string;
  originalUrl?: string;
  sku?: string;
  color?: string;
  size?: string;
  originalPrice: number;    // Base price in EGP (or converted)
  currency: string;         // 'EGP'
  quantity: number;
  subtotal: number;
  status?: ItemStatus;
  adminComment?: string;    // Comment by admin specifically for this good
}

export interface PaymentDetails {
  method: 'instapay' | 'vodafone_cash';
  senderIdentifier: string;  // Sender phone number or InstaPay address
  transactionReference?: string;
  receiptImage?: string;     // URL or base64 data
  submittedAt: string;
  adminNote?: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  shippingAddress?: string;
  
  // Extraction info
  rawInput: string;
  extractedLink: string;
  cartShareCode?: string;
  cartGroupId?: string;
  cartCoverImage?: string;
  
  // Goods and Pricing
  items: GoodItem[];
  itemsCount: number;
  itemsSubtotal: number;
  dynamicFeePercent: number; // e.g. 20%
  dynamicFeeAmount: number;  // itemsSubtotal * (dynamicFeePercent / 100)
  shippingFee: number;
  totalCash: number;         // itemsSubtotal + dynamicFeeAmount + shippingFee
  currency: string;          // 'EGP'
  
  // Workflow & Review
  status: OrderStatus;
  adminComment?: string;     // Admin's general review comment
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  
  // Payment Proof
  payment?: PaymentDetails;
  
  createdAt: string;
  updatedAt: string;
}

export interface CustomSectionCard {
  id: string;
  title: string;
  desc: string;
  icon?: string;
  link?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  content?: string;
  type: 'banner' | 'cards' | 'text' | 'faq';
  cards?: CustomSectionCard[];
  position: 'top' | 'middle' | 'bottom';
  theme?: 'purple' | 'amber' | 'emerald' | 'dark' | 'glass';
  enabled: boolean;
  createdAt?: string;
}

export interface SystemSettings {
  // Pricing & Fees
  dynamicFeePercent: number;    // Default 20
  flatShippingFee: number;      // Default 0 or 50 EGP
  currency: string;             // 'EGP'

  // Payment Options & Details
  showPaymentInSupport: boolean;      // Toggle payment section in support modal
  enableInstapay: boolean;            // Enable/disable InstaPay
  instapayAddress: string;            // e.g. 'shein.orders@instapay'
  instapayAccountName: string;        // e.g. 'SHEIN Concierge Egypt'
  enableVodafoneCash: boolean;        // Enable/disable Vodafone Cash
  vodafoneCashNumber: string;         // e.g. '01284947782'
  vodafoneCashInstructions: string;
  secondaryWalletNumber?: string;     // Additional wallet number (e.g. Orange / Etisalat)
  secondaryWalletName?: string;       // e.g. 'محفظة إضافية / اتصالات كاش'

  // Support & Contact
  supportPhone: string;
  supportWhatsapp?: string;
  supportEmail?: string;
  supportHours?: string;

  // Built-in Section Customization
  announcementEnabled?: boolean;
  announcementText?: string;
  announcementLink?: string;
  announcementBg?: 'purple' | 'amber' | 'emerald' | 'rose';

  heroBadge?: string;
  heroTitle?: string;
  heroSubtitle?: string;

  howItWorksEnabled?: boolean;
  step1Title?: string;
  step1Desc?: string;
  step2Title?: string;
  step2Desc?: string;
  step3Title?: string;
  step3Desc?: string;

  trustMetricsEnabled?: boolean;

  // Custom Sections created by Admin
  customSections?: CustomSection[];
}

export interface ExtractedCartResult {
  rawInput: string;
  extractedLink: string;
  title: string;
  description: string;
  coverImage?: string;
  shareCode?: string;
  groupId?: string;
  items: GoodItem[];
  itemsSubtotal: number;
  dynamicFeePercent: number;
  dynamicFeeAmount: number;
  totalCash: number;
  currency: string;
}
