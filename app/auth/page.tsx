import ImageCard from "@/components/auth/ImageCard";
import LoginFormCard from "@/components/auth/LoginFormCard";
import React from "react";

export default function Auth() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-terciary to-primary font-sans text-secondary">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        <ImageCard />
        <LoginFormCard />
      </div>
    </div>
  );
}
