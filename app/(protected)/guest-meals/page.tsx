import { redirect } from "next/navigation";

export default function GuestMealsRedirect() {
  redirect("/meals");
}
