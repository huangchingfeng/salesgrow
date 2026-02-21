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
      ALTER TABLE sales_profiles
      ADD COLUMN IF NOT EXISTS custom_links jsonb DEFAULT '[]'
    `;
    await sql.end();
    return NextResponse.json({ success: true, message: 'custom_links column added' });
  } catch (error: any) {
    await sql.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
