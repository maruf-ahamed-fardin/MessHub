import { redirect } from "next/navigation";

export default function ShoppingRedirect() {
  redirect("/house?tab=shopping");
}
