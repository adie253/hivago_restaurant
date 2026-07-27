import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { KitchenTicket } from './KitchenTicket';
import { KitchenTicketDto } from '../../types/api';

const mockTicket: KitchenTicketDto = {
  orderId: 'order-123',
  orderNumber: '999',
  fulfillmentType: 'Delivery',
  fulfillmentDisplay: 'Delivery by Hivago',
  customerName: 'Aditya',
  statusDisplay: 'PAID',
  placedAt: '07th Jul 2026 at 04:30 PM',
  totalItems: 3,
  specialInstructions: 'No onions, extra spicy',
  cutleryRequested: true,
  items: [
    {
      itemName: 'Paneer Butter Masala',
      quantity: 2,
      specialInstructions: 'Less oil',
    },
    {
      itemName: 'Tandoori Roti',
      quantity: 5,
      specialInstructions: null,
    }
  ]
};

describe('KitchenTicket Component', () => {
  it('renders order number, customer name, status, and instructions', () => {
    render(<KitchenTicket ticket={mockTicket} />);

    expect(screen.getByText('#999')).toBeInTheDocument();
    expect(screen.getByText('Delivery by Hivago')).toBeInTheDocument();
    expect(screen.getByText('Aditya')).toBeInTheDocument();
    expect(screen.getByText('PAID')).toBeInTheDocument();
    expect(screen.getByText('No onions, extra spicy')).toBeInTheDocument();
  });

  it('renders quantities and item names', () => {
    render(<KitchenTicket ticket={mockTicket} />);

    expect(screen.getByText('Paneer Butter Masala')).toBeInTheDocument();
    expect(screen.getByText('2x')).toBeInTheDocument();
    expect(screen.getByText('* Less oil')).toBeInTheDocument();

    expect(screen.getByText('Tandoori Roti')).toBeInTheDocument();
    expect(screen.getByText('5x')).toBeInTheDocument();
  });

  it('shows SEND CUTLERY badge when cutleryRequested is true', () => {
    render(<KitchenTicket ticket={mockTicket} />);
    expect(screen.getByText('** SEND CUTLERY **')).toBeInTheDocument();
  });

  it('hides SEND CUTLERY badge when cutleryRequested is false', () => {
    const noCutleryTicket = { ...mockTicket, cutleryRequested: false };
    render(<KitchenTicket ticket={noCutleryTicket} />);
    expect(screen.queryByText('** SEND CUTLERY **')).not.toBeInTheDocument();
  });

  it('renders no pricing details', () => {
    render(<KitchenTicket ticket={mockTicket} />);
    
    // Kitchen copy should not contain rupee signs or price lines
    const content = document.body.textContent || '';
    expect(content).not.toContain('₹');
    expect(content).not.toContain('Price');
  });
});
