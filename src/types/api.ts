export interface KitchenTicketDto {
  orderId: string;
  orderNumber: string;
  fulfillmentType: "Delivery" | "Pickup";
  fulfillmentDisplay: string;
  customerName: string;
  statusDisplay: string;
  placedAt: string;
  totalItems: number;
  specialInstructions: string | null;
  cutleryRequested: boolean;
  items: {
    itemName: string;
    quantity: number;
    specialInstructions: string | null;
  }[];
}

export interface OrderLabelDto {
  orderId: string;
  orderNumber: string;
  fulfillmentType: "Delivery" | "Pickup";
  fulfillmentDisplay: string;
  statusDisplay: string;
  placedAt: string;
  customerName: string;
  customerPhone: string | null;
  restaurantName: string;
  restaurantAddress: string | null;
  restaurantFssai: string | null;
  platformFssai: string | null;
  deliveryAddress: string | null;
  distanceKm: number | null;
  estimatedMinutes: number | null;
  deliveryOtp: string | null;
  totalItems: number;
  currency: string;
  subTotal: number;
  tax: number;
  deliveryFee: number;
  packagingFee: number;
  discount: number;
  total: number;
  specialInstructions: string | null;
  cutleryRequested: boolean;
  items: {
    itemName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    specialInstructions: string | null;
  }[];
}
