import { NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET() {
  const secret = process.env.MIGRATION_SECRET;
  if (!secret || secret !== 'run-migration-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = postgres(process.env.DATABASE_URL!, {
    max: 1,
    connect_timeout: 15,
  });

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS sales_profiles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        job_title varchar(100),
        company_name varchar(255),
        company_description text,
        products_services text,
        industry varchar(100),
        target_audience text,
        unique_selling_points text,
        years_experience integer,
        communication_style varchar(50),
        personal_bio text,
        phone varchar(50),
        line_id varchar(100),
        linkedin_url text,
        created_at timestamptz DEFAULT now() NOT NULL,
        updated_at timestamptz DEFAULT now() NOT NULL
      )
    `;
    await sql.end();
    return NextResponse.json({ success: true, message: 'sales_profiles table created' });
  } catch (error: any) {
    await sql.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
