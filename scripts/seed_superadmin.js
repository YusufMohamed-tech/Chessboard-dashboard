/**
 * Seed the root superadmin account into the database.
 * Run once after creating the schema:
 *   node scripts/seed_superadmin.js
 *
 * Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rgicbhykockclxwironu.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const ROOT_EMAIL = 'superadmin1234@gmail.com'
const ROOT_PASSWORD = 'chessboard2026'
const ROOT_NAME = 'يوسف محمد'

async function seed() {
  if (!SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY env var')
    console.log('Run with: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/seed_superadmin.js')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  console.log('🔐 Hashing password...')
  const password_hash = await bcrypt.hash(ROOT_PASSWORD, 10)

  console.log('📦 Inserting root superadmin...')

  // Check if already exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', ROOT_EMAIL)
    .single()

  if (existing) {
    console.log('⚠️  Root superadmin already exists. Updating password...')
    const { error } = await supabase
      .from('profiles')
      .update({ password_hash, name: ROOT_NAME, is_root: true, status: 'active' })
      .eq('email', ROOT_EMAIL)

    if (error) {
      console.error('❌ Update failed:', error.message)
      process.exit(1)
    }
    console.log('✅ Root superadmin updated successfully!')
  } else {
    const { error } = await supabase.from('profiles').insert({
      name: ROOT_NAME,
      email: ROOT_EMAIL,
      personal_email: ROOT_EMAIL,
      password_hash,
      role: 'superadmin',
      city: 'الرياض',
      status: 'active',
      is_root: true,
      assigned_brands: [],
    })

    if (error) {
      console.error('❌ Insert failed:', error.message)
      process.exit(1)
    }
    console.log('✅ Root superadmin created successfully!')
  }

  console.log(`\n📧 Email: ${ROOT_EMAIL}`)
  console.log(`🔑 Password: ${ROOT_PASSWORD}`)
  console.log('\n🎉 You can now log in to the dashboard!')
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
