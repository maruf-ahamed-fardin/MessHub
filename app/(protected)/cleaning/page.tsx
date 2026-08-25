import { redirect } from "next/navigation";

export default function CleaningRedirect() {
  redirect("/house?tab=cleaning");
}
