"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OTPInputProps {
  length?: number;
  onComplete?: (otp: string) => void;
}

export default function OTPInput({
  length = 6,
  onComplete,
}: OTPInputProps = {}) {
  const [otp, setOtp] = useState(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit !== "")) {
      onComplete?.(newOtp.join(""));
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, length);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length; i++) {
      if (isNaN(Number(pastedData[i]))) continue;
      newOtp[i] = pastedData[i];
    }

    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, length - 1)]?.focus();

    if (newOtp.every((digit) => digit !== "")) {
      onComplete?.(newOtp.join(""));
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <Label
        htmlFor="otp-input-0"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        Enter OTP
      </Label>
      <div className="flex justify-between gap-2">
        {otp.map((digit, index) => (
          <Input
            key={index}
            id={`otp-input-${index}`}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            ref={(el) => (inputRefs.current[index] = el)}
            className="w-12 h-12 text-center text-2xl font-bold rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary dark:focus:border-primary-400 dark:focus:ring-primary-400 transition-all duration-200"
            maxLength={1}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
