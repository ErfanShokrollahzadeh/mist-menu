import { categories } from "@/lib/menu";
import { MenuManager } from "@/components/admin/MenuManager";

export default function AdminMenuPage() {
  return <MenuManager categories={categories} />;
}
