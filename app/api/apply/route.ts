import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { sendApplicationReceived, sendNewApplicationAlert } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = await createClient();

  // Use form email as the primary email — not the auth session email
  const applicantEmail = body.email;
  if (!applicantEmail) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Try to find existing operator by email (not user_id, since no auth required now)
  let operator: any;
  const { data: existing } = await adminSupabase
    .from("operators")
    .select("id, full_name, email")
    .eq("email", applicantEmail)
    .single();

  if (existing) {
    operator = existing;
    // Update phone if provided
    if (body.phone) {
      await adminSupabase.from("operators").update({ phone: body.phone }).eq("id", operator.id);
    }
  } else {
    const { data: created, error: createError } = await adminSupabase
      .from("operators")
      .insert({
        user_id:       null,
        handle:        (body.fullName || "operator")
                         .toLowerCase()
                         .replace(/[^a-z0-9]/g, "_")
                         .replace(/_+/g, "_")
                         .slice(0, 20),
        full_name:     body.fullName || "Unknown",
        email:         applicantEmail,
        phone:         body.phone || null,
        age:           body.age || null,
        location:      body.location || null,
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

  // Insert application with email stored
  const { error: insertError } = await adminSupabase
    .from("applications")
    .insert({
      operator_id:    operator.id,
      email:          applicantEmail,
      phone:          body.phone || null,
      q_100_plan:     body.q1,
      q_inefficiency: body.q2,
      q_value_story:  body.q3,
      q_best_at:      body.q4,
      q_10k_plan:     body.q5,
      q_edge:         body.q6,
      id_photo_path:  body.idPhotoPath || null,
      selfie_path:    body.selfiePath || null,
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Send emails using the form email
  Promise.allSettled([
    sendApplicationReceived(applicantEmail, body.fullName || "there"),
    sendNewApplicationAlert(process.env.ADMIN_EMAIL!, body.fullName || "Someone"),
  ]);

  return NextResponse.json({ success: true });
}