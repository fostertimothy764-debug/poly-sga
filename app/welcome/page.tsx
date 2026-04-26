import { Suspense } from "react";
import WelcomeClient from "./client";

export const metadata = {
  title: "Welcome · Poly SGA",
};

export default function WelcomePage() {
  return (
    <Suspense>
      <WelcomeClient />
    </Suspense>
  );
}
