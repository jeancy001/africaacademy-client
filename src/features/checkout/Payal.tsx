import { useEffect, useRef } from "react";

interface ProductsDetails {
  value: string;
  description: string;
  onSuccess?: () => void; // Add optional onSuccess callback
}

declare global {
  interface Window {
    paypal: any;
  }
}

function Paypal({ value, description, onSuccess }: ProductsDetails) {
  const paypalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.paypal) return;

    window.paypal
      .Buttons({
        createOrder: (data: unknown, actions: any) => {
          console.log(data)
          return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
              {
                description,
                amount: {
                  currency_code: "USD",
                  value,
                },
              },
            ],
          });
        },

        onApprove: async (data: any, actions: any) => {
          console.log(data)
          try {
            const order = await actions.order.capture();
            console.log("Payment successful:", order);

            // Call the parent's onSuccess function if provided
            if (onSuccess) onSuccess();
          } catch (err) {
            console.error("Error capturing order:", err);
          }
        },

        onError: (err: any) => {
          console.error("PayPal error:", err);
        },
      })
      .render(paypalRef.current);

    // Cleanup PayPal buttons when component unmounts
    return () => {
      if (paypalRef.current) paypalRef.current.innerHTML = "";
    };
  }, [value, description, onSuccess]);

  return <div ref={paypalRef}></div>;
}

export default Paypal;