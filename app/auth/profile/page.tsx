import ProfileSetup from "@/components/profile-setup";
import { createClient } from "@/utils/supabase/server";

export default async function ProfileSetupPage() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  return (
    <div className="container mx-auto">
      <ProfileSetup userId={user.user!.id} />
    </div>
  );
}
