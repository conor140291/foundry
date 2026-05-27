import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { sendApplicationReceived, sendNewApplicationAlert } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let operator: any;
  const { data: existing } = await adminSupabase
    .from("operators")
    .select("id, full_name, email")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    operator = existing;
  } else {
const { data: created, error: createError } = await adminSupabase
  .from("operators")
  .insert({
    user_id:      user.id,
    handle:       (body.fullName || "operator")
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "_")
                    .replace(/_+/g, "_")
                    .slice(0, 20),
    full_name:    body.fullName || "Unknown",
    email:        body.email || user.email,
    phone:        body.phone || null,
    age:          body.age || null,
    location:     body.location || null,
    social_handle: body.socialHandle || null,
  })
  .select()
  .single();

if (createError) {
  console.error("Operator create error:", createError);
  return NextResponse.json({ error: createError.message }, { status: 500 });
}
operator = created;
  }

  const { error: insertError } = await adminSupabase
    .from("applications")
    .insert({
      operator_id:    operator.id,
      q_100_plan:     body.q1,
      q_inefficiency: body.q2,
      q_value_story:  body.q3,
      q_best_at:      body.q4,
      q_10k_plan:     body.q5,
      q_edge:         body.q6,
      id_photo_path:  body.idPhotoPath,
      selfie_path:    body.selfiePath,
    });

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  Promise.allSettled([
    sendApplicationReceived(user.email!, operator.full_name),
    sendNewApplicationAlert(process.env.ADMIN_EMAIL!, operator.full_name),
  ]);

  return NextResponse.json({ success: true });
}