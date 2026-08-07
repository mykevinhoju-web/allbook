import { NextResponse } from "next/server";

import { ownerOwnsSalon } from "@/features/dashboard/getOwnerSalon";
import { getCustomer } from "@/features/customers/getCustomers";
import { updateCustomer } from "@/features/customers/updateCustomer";
import type { CustomerInput } from "@/features/customers/types";
import { createClient } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      salonId?: string;
      patch?: Partial<CustomerInput>;
    };

    if (!body.salonId || !body.patch) {
      return NextResponse.json(
        { error: "salonId and patch are required." },
        { status: 400 },
      );
    }

    const session = await createClient();
    const {
      data: { user },
    } = await session.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const owns = await ownerOwnsSalon(user.id, body.salonId, session);
    if (!owns) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const supabase = createServiceSupabase();
    const current = await getCustomer(supabase, body.salonId, id);
    if (!current) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 },
      );
    }

    const customer = await updateCustomer(supabase, current, body.patch);
    return NextResponse.json({ customer });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update customer.",
      },
      { status: 400 },
    );
  }
}
