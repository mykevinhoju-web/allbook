import { redirect } from "next/navigation";

/** Generic /search is retired — marketplace search starts on the landing hero. */
export default function SearchRouteRedirect() {
  redirect("/");
}
