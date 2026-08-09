import { redirect } from "next/navigation";

export default function SimulationPage() {
  redirect("/material/demo?layer=stress-test");
}
