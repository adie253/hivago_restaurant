import { Order } from '../types';

interface AuthUserMinimal {
  id?: string;
  name?: string;
  email?: string;
  ownerName?: string;
  ownerEmail?: string;
}

const SUPPORT_PHONE = import.meta.env.VITE_SUPPORT_WHATSAPP_NUMBER || '919082220155';

/**
 * Formats a clean WhatsApp URL for general support queries with restaurant details.
 */
export const getGeneralSupportUrl = (user?: AuthUserMinimal | null): string => {
  const lines: string[] = [
    '👋 *Hivago Restaurant Support Request*',
    '',
    `*Restaurant Name:* ${user?.name || 'N/A'}`,
    `*Restaurant ID:* ${user?.id || 'N/A'}`,
  ];

  if (user?.ownerName) {
    lines.push(`*Owner:* ${user.ownerName}`);
  }
  if (user?.email || user?.ownerEmail) {
    lines.push(`*Email:* ${user.email || user.ownerEmail}`);
  }

  lines.push('');
  lines.push('*Issue Details:* ');

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${SUPPORT_PHONE}?text=${text}`;
};

interface OrderSupportOptions {
  order: Order;
  restaurantName?: string;
  type?: 'help' | 'issue';
}

/**
 * Formats a comprehensive WhatsApp URL for order-specific help or issue reporting.
 */
export const getOrderSupportUrl = ({ order, restaurantName, type = 'help' }: OrderSupportOptions): string => {
  const isIssue = type === 'issue';
  const title = isIssue
    ? `⚠️ *Report Issue - Order #${order.orderNumber}*`
    : `🚨 *Order Support - Order #${order.orderNumber}*`;

  const lines: string[] = [
    title,
    '',
    `*Restaurant Name:* ${restaurantName || 'N/A'}`,
    `*Order Number:* #${order.orderNumber}`,
    `*Status:* ${order.status}`,
    `*Pickup Type:* ${order.pickupType}`,
    `*Total Amount:* ₹${order.total}`,
    '',
    `*Customer Name:* ${order.customerName || 'N/A'}`,
    `*Customer Phone:* ${order.customerPhone || 'N/A'}`,
  ];

  if (order.pickupType === 'DELIVERY' && order.address) {
    lines.push(`*Delivery Address:* ${order.address}`);
  }

  if (order.otp) {
    lines.push(`*Verification OTP:* ${order.otp}`);
  }

  if (order.riderName) {
    lines.push(`*Rider Details:* ${order.riderName}${order.riderPhone ? ` (${order.riderPhone})` : ''}`);
  }

  if (order.items && order.items.length > 0) {
    lines.push('');
    lines.push('*Order Items:*');
    order.items.forEach((item) => {
      const priceStr = item.price ? ` - ₹${item.price * item.quantity}` : '';
      lines.push(`• ${item.quantity}x ${item.name}${priceStr}`);
    });
  }

  lines.push('');
  lines.push(isIssue ? '*Describe the Issue:* ' : '*How can we help?* ');

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${SUPPORT_PHONE}?text=${text}`;
};
