import { redirect } from "next/navigation";

export default function AdminMetricsRedirect() {
  redirect("/admin/health");
}
