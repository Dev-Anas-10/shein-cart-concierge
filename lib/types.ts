export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: string;
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

export interface SystemSettings {
  dynamicFeePercent: number;    // Default 20
  flatShippingFee: number;      // Default 0 or 50 EGP
  currency: string;             // 'EGP'
  instapayAddress: string;       // e.g. 'sheinextract@instapay'
  instapayAccountName: string;   // e.g. 'SHEIN Express Egypt'
  vodafoneCashNumber: string;    // e.g. '01012345678'
  vodafoneCashInstructions: string;
  supportPhone: string;
  announcementText?: string;
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
