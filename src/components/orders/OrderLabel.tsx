import React, { forwardRef } from 'react';
import { OrderLabelDto } from '../../types/api';

interface OrderLabelProps {
  label: OrderLabelDto | null;
}

export const OrderLabel = forwardRef<HTMLDivElement, OrderLabelProps>(({ label }, ref) => {
  if (!label) return null;

  const isDelivery = label.fulfillmentType === "Delivery";
  const currencySymbol = label.currency === "INR" || label.currency === "₹" ? "₹" : label.currency;

  return (
    <div ref={ref} className="w-[72mm] p-2 font-mono text-black bg-white text-xs leading-normal select-none">
      {/* Restaurant Header */}
      <div className="text-center border-b border-black pb-2 mb-2">
        <h1 className="text-sm font-extrabold uppercase">{label.restaurantName}</h1>
        {label.restaurantAddress && <p className="text-[10px]">{label.restaurantAddress}</p>}
        <p className="text-[10px]">FSSAI: {label.restaurantFssai || 'N/A'}</p>
      </div>

      {/* Order Info */}
      <div className="border-b border-black pb-2 mb-2 text-center">
        <p className="text-lg font-extrabold">#{label.orderNumber}</p>
        <p className="text-[11px] font-bold">
          {label.fulfillmentDisplay} • {label.placedAt}
        </p>
        <p className="text-xs font-extrabold mt-1 uppercase">{label.statusDisplay}</p>
      </div>

      {/* Customer Info */}
      <div className="border-b border-black pb-2 mb-2 space-y-0.5">
        <p><strong>Customer:</strong> {label.customerName}</p>
        {label.customerPhone && <p><strong>Phone:</strong> {label.customerPhone}</p>}
      </div>

      {/* Delivery Info (Guarded on Delivery type + non-null) */}
      {isDelivery && (
        <div className="border-b border-black pb-2 mb-2 space-y-1">
          {label.deliveryAddress && (
            <p><strong>Delivery Address:</strong> {label.deliveryAddress}</p>
          )}
          {(label.distanceKm !== null || label.estimatedMinutes !== null) && (
            <p className="text-[11px] font-semibold">
              ({label.distanceKm !== null ? `${label.distanceKm} KMS` : ''}
              {label.distanceKm !== null && label.estimatedMinutes !== null ? ', ' : ''}
              {label.estimatedMinutes !== null ? `${label.estimatedMinutes} MINS AWAY` : ''})
            </p>
          )}
          {label.deliveryOtp && (
            <p className="text-sm font-extrabold">OTP: {label.deliveryOtp}</p>
          )}
        </div>
      )}

      {/* Items Section */}
      <div className="border-b border-black pb-2 mb-2">
        <div className="flex border-b border-dashed border-black pb-1 mb-1 font-bold">
          <span className="w-12 text-left font-extrabold">Qty</span>
          <span className="flex-1 text-left">Item Details</span>
          <span className="w-16 text-right">Price</span>
        </div>
        <div className="space-y-2">
          {label.items.map((item, index) => (
            <div key={index} className="flex items-start">
              <span className="w-12 text-left font-extrabold">{item.quantity}x</span>
              <div className="flex-1 text-left">
                <span className="font-bold">{item.itemName}</span>
                {item.specialInstructions && (
                  <p className="text-[10px] text-gray-700 italic mt-0.5">* {item.specialInstructions}</p>
                )}
              </div>
              <span className="w-16 text-right font-bold">
                {currencySymbol}{Math.round(item.lineTotal)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Money Block */}
      <div className="border-b border-black pb-2 mb-2 space-y-1 text-right">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{currencySymbol}{Math.round(label.subTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax:</span>
          <span>{currencySymbol}{Math.round(label.tax)}</span>
        </div>
        {label.deliveryFee > 0 && (
          <div className="flex justify-between">
            <span>Delivery Fee:</span>
            <span>{currencySymbol}{Math.round(label.deliveryFee)}</span>
          </div>
        )}
        {label.packagingFee > 0 && (
          <div className="flex justify-between">
            <span>Packaging Fee:</span>
            <span>{currencySymbol}{Math.round(label.packagingFee)}</span>
          </div>
        )}
        {label.discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Discount:</span>
            <span>-{currencySymbol}{Math.round(label.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-extrabold text-sm border-t border-dashed border-black pt-1">
          <span>Total Paid:</span>
          <span>{currencySymbol}{Math.round(label.total)}</span>
        </div>
      </div>

      {/* Special Requests / Cutlery */}
      {(label.specialInstructions || label.cutleryRequested) && (
        <div className="border-b border-black pb-2 mb-2 text-left space-y-1">
          {label.specialInstructions && (
            <div>
              <p className="font-bold">Order requests:</p>
              <p className="italic bg-gray-100 p-1.5 rounded">{label.specialInstructions}</p>
            </div>
          )}
          {label.cutleryRequested && (
            <p className="text-xs font-extrabold text-center py-1 border border-black uppercase">
              Cutlery Included
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-[10px] space-y-1 mt-2 text-gray-800">
        <p>This is not a tax invoice.</p>
        <p>Hivago FSSAI: {label.platformFssai || '11526998000419'}</p>
      </div>
    </div>
  );
});

OrderLabel.displayName = 'OrderLabel';
