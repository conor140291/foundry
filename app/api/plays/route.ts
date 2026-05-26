import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { sendNewPlayNotification } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: operator } = await supabase
    .from("operators")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!operator) return NextResponse.json({ plays: [] });

  const { data: plays } = await supabase
    .from("plays")
    .select("*")
    .eq("operator_id", operator.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ plays: plays || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const { data: operator } = await supabase
    .from("operators")
    .select("id, handle, status, current_allocation")
    .eq("user_id", user.id)
    .single();

  if (!operator || operator.status !== "active") {
    return NextResponse.json({ error: "Operator not active" }, { status: 403 });
  }

  if (body.capital_in > operator.current_allocation) {
    return NextResponse.json(
      { error: `Capital exceeds your current allocation (€${operator.current_allocation})` },
      { status: 400 }
    );
  }

  const { data: play, error } = await adminSupabase
    .from("plays")
    .insert({
      operator_id:  operator.id,
      title:        body.title,
      description:  body.description || null,
      platform:     body.platform || null,
      category:     body.category || null,
      capital_in:   body.capital_in,
      status:       "proposed",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  sendNewPlayNotification(
    process.env.ADMIN_EMAIL!,
    operator.handle,
    body.title
  );

  return NextResponse.json({ play });
}