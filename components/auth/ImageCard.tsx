import React from "react";

export default function ImageCard() {
  return (
    <div className="relative hidden md:flex items-center justify-center bg-indigo-100">
      <div className="absolute top-4 left-6">
        <h1 className="text-primary font-black text-2xl">Auto Escola Silva</h1>
      </div>
      <img src="/login_card.png" alt="Login illustration" className="w-4/5" />
    </div>
  );
}
