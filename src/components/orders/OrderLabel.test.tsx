import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrderLabel } from './OrderLabel';
import { OrderLabelDto } from '../../types/api';

const mockDeliveryLabel: OrderLabelDto = {
  orderId: 'order-123',
  orderNumber: '999',
  fulfillmentType: 'Delivery',
  fulfillmentDisplay: 'Delivery by Hivago',
  statusDisplay: 'PAID',
  placedAt: '07th Jul 2026 at 04:30 PM',
  customerName: 'Aditya',
  customerPhone: '9876543210',
  restaurantName: 'Hivago Royal Kitchen',
  restaurantAddress: '123 Main St, Mumbai',
  restaurantFssai: '21526068000923',
  platformFssai: '11526998000419',
  deliveryAddress: '456 Park Avenue, Apt 4B',
  distanceKm: 4.5,
  estimatedMinutes: 25,
  deliveryOtp: '4829',
  totalItems: 2,
  currency: 'INR',
  subTotal: 300.0,
  tax: 15.0,
  deliveryFee: 30.0,
  packagingFee: 10.0,
  discount: 50.0,
  total: 305.0,
  specialInstructions: 'Leave at gate',
  cutleryRequested: true,
  items: [
    {
      itemName: 'Paneer Tikka',
      quantity: 1,
      unitPrice: 200.0,
      lineTotal: 200.0,
      specialInstructions: null,
    },
    {
      itemName: 'Butter Naan',
      quantity: 2,
      unitPrice: 50.0,
      lineTotal: 100.0,
      specialInstructions: null,
    }
  ]
};

const mockPickupLabel: OrderLabelDto = {
  ...mockDeliveryLabel,
  fulfillmentType: 'Pickup',
  fulfillmentDisplay: 'Self Pickup',
  deliveryAddress: null,
  distanceKm: null,
  estimatedMinutes: null,
  deliveryOtp: null,
};

describe('OrderLabel Component', () => {
  it('renders restaurant name, FSSAI numbers, and order details', () => {
    render(<OrderLabel label={mockDeliveryLabel} />);

    expect(screen.getByText('Hivago Royal Kitchen')).toBeInTheDocument();
    expect(screen.getByText('FSSAI: 21526068000923')).toBeInTheDocument();
    expect(screen.getByText('Hivago FSSAI: 11526998000419')).toBeInTheDocument();
    expect(screen.getByText('#999')).toBeInTheDocument();
  });

  it('renders all financial details, item breakdown, and total paid', () => {
    render(<OrderLabel label={mockDeliveryLabel} />);

    expect(screen.getByText('Paneer Tikka')).toBeInTheDocument();
    expect(screen.getByText('Butter Naan')).toBeInTheDocument();
    
    // Financial checks
    expect(screen.getByText('Subtotal:')).toBeInTheDocument();
    expect(screen.getByText('₹300')).toBeInTheDocument();
    expect(screen.getByText('Tax:')).toBeInTheDocument();
    expect(screen.getByText('₹15')).toBeInTheDocument();
    expect(screen.getByText('Discount:')).toBeInTheDocument();
    expect(screen.getByText('-₹50')).toBeInTheDocument();
    expect(screen.getByText('Total Paid:')).toBeInTheDocument();
    expect(screen.getByText('₹305')).toBeInTheDocument();
  });

  it('renders delivery address, distance, and OTP for a delivery order', () => {
    render(<OrderLabel label={mockDeliveryLabel} />);

    expect(screen.getByText('Delivery Address:')).toBeInTheDocument();
    expect(screen.getByText(/456 Park Avenue, Apt 4B/)).toBeInTheDocument();
    expect(screen.getByText('(4.5 KMS, 25 MINS AWAY)')).toBeInTheDocument();
    expect(screen.getByText('OTP: 4829')).toBeInTheDocument();
  });

  it('hides delivery address, distance, and OTP for a pickup order', () => {
    render(<OrderLabel label={mockPickupLabel} />);

    expect(screen.queryByText('Delivery Address:')).not.toBeInTheDocument();
    expect(screen.queryByText('KMS')).not.toBeInTheDocument();
    expect(screen.queryByText('OTP:')).not.toBeInTheDocument();
  });

  it('shows Cutlery Included when cutleryRequested is true', () => {
    render(<OrderLabel label={mockDeliveryLabel} />);
    expect(screen.getByText('Cutlery Included')).toBeInTheDocument();
  });
});
