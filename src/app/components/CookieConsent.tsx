'use client';
import { hasCookie, setCookie } from "cookies-next";
import { useEffect, useState } from "react";
import { set } from "zod";

export const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    setShowConsent(!hasCookie("cookieConsent"));
  }, []);

  const handleDeny = () => {
    setCookie("cookieConsent", "denied");
    setShowConsent(false);
  }

  const handleAccept = () => {
    setCookie("cookieConsent", "accepted");
    setShowConsent(false);
  }

  return (
    <>
      {showConsent && (
        <div className="toast toast-end">
          <div className="alert">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-info h-6 w-6 shrink-0">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Allow non-essential cookies?</span>
            <div>
              <button className="btn btn-sm" onClick={handleDeny}>Deny</button>
              <button className="btn btn-sm btn-primary" onClick={handleAccept}>Accept</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}