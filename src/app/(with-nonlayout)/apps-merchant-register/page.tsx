import type { Metadata } from "next";
import MerchantRegisterForm from "@/components/Merchant/MerchantRegisterForm";

export const metadata: Metadata = {
  title: "Register Merchant | POS",
};

export default function MerchantRegisterPage() {
  return <MerchantRegisterForm />;
}
