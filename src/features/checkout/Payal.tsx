import { useEffect, useRef, useState } from "react";

interface ProductsDetails {
  value: string;
  description: string;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

function Paypal({ value, description, onSuccess }: ProductsDetails) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  // Wait until PayPal SDK is loaded
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.paypal) {
        setLoaded(true);
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Render PayPal buttons once
  useEffect(() => {
    if (!loaded || !paypalRef.current || buttonsRef.current) return;

    buttonsRef.current = window.paypal.Buttons({
      style: { layout: "vertical", color: "blue", shape: "rect", label: "paypal" },

      createOrder: (_data: any, actions: any) => {
        // Use the latest value/description dynamically
        return actions.order.create({
          intent: "CAPTURE",
          purchase_units: [
            {
              description,
              amount: { currency_code: "USD", value },
            },
          ],
        });
      },

      onApprove: async (_data: any, actions: any) => {
        try {
          const order = await actions.order.capture();
          console.log("Payment successful:", order);
          if (onSuccess) onSuccess();
        } catch (err) {
          console.error("Error capturing order:", err);
        }
      },

      onError: (err: any) => console.error("PayPal error:", err),
    });

    buttonsRef.current.render(paypalRef.current);

    return () => {
      if (paypalRef.current) paypalRef.current.innerHTML = "";
      buttonsRef.current = null;
    };
  }, [loaded]);

  return <div ref={paypalRef}></div>;
}

export default Paypal;
