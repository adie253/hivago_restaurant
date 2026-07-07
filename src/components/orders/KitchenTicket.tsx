import React, { forwardRef } from 'react';
import { KitchenTicketDto } from '../../types/api';

interface KitchenTicketProps {
  ticket: KitchenTicketDto | null;
}

export const KitchenTicket = forwardRef<HTMLDivElement, KitchenTicketProps>(({ ticket }, ref) => {
  if (!ticket) return null;

  return (
    <div ref={ref} className="w-[72mm] p-2 font-mono text-black bg-white text-xs leading-normal select-none">
      <div className="text-center border-b border-black pb-2 mb-2">
        <h1 className="text-base font-extrabold">KITCHEN ORDER TICKET</h1>
        <p className="text-xl font-extrabold my-1">#{ticket.orderNumber}</p>
        <p className="text-xs font-semibold">{ticket.fulfillmentDisplay}</p>
      </div>

      <div className="mb-2 border-b border-black pb-2 space-y-1">
        <p><strong>Date:</strong> {ticket.placedAt}</p>
        <p><strong>Customer:</strong> {ticket.customerName}</p>
        <p><strong>Status:</strong> {ticket.statusDisplay}</p>
      </div>

      <div className="border-b border-black pb-2 mb-2">
        <div className="flex border-b border-dashed border-black pb-1 mb-1 font-bold">
          <span className="w-12 text-left font-extrabold">Qty</span>
          <span className="flex-1 text-left">Item Details</span>
        </div>
        <div className="space-y-2">
          {ticket.items.map((item, index) => (
            <div key={index} className="flex items-start">
              <span className="w-12 text-left font-extrabold">{item.quantity}x</span>
              <div className="flex-1 text-left">
                <span className="font-bold">{item.itemName}</span>
                {item.specialInstructions && (
                  <p className="text-[10px] text-gray-700 italic mt-0.5">* {item.specialInstructions}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {ticket.specialInstructions && (
        <div className="border-b border-black pb-2 mb-2 text-left">
          <p className="font-bold">Order requests:</p>
          <p className="italic bg-gray-100 p-1.5 rounded">{ticket.specialInstructions}</p>
        </div>
      )}

      {ticket.cutleryRequested && (
        <p className="text-sm font-extrabold text-center my-1">** SEND CUTLERY **</p>
      )}

      <div className="text-center font-bold mt-2">
        TOTAL ITEMS: {ticket.totalItems}
      </div>
    </div>
  );
});

KitchenTicket.displayName = 'KitchenTicket';
