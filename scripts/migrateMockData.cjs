const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rgicbhykockclxwironu.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnaWNiaHlrb2NrY2x4d2lyb251Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjgwMzcyNCwiZXhwIjoyMDkyMzc5NzI0fQ.lKaTSOsRxVKRWA_mzKTD5Tqq8bYBoA53bhOeoCpwdOA'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function migrateData() {
  console.log('Loading mock data...')
  // Using dynamic import because mockData.js is an ES module
  const mockData = await import('../src/data/mockData.js')
  console.log('Starting migration...')

  try {
    // 1. Migrate Locations
    console.log('Migrating locations...')
    for (const loc of mockData.mockOffices) {
      const { error } = await supabase.from('locations').insert({
        name: loc.name,
        city: loc.city,
        brand: loc.brand,
        type: 'branch',
        created_at: new Date().toISOString()
      })
      if (error) console.error('Error migrating location:', error)
    }

    // Maps for foreign keys since we can't use the mock string IDs in UUID fields
    const adminIdMap = {}
    const shopperIdMap = {}

    // 2. Migrate Admins
    console.log('Migrating admins...')
    for (const admin of mockData.mockAdmins) {
      const { data, error } = await supabase.from('admins').insert({
        name: admin.name,
        email: admin.email,
        password: admin.password,
        role: admin.role,
        assigned_brands: admin.assignedBrands || [],
        created_at: new Date().toISOString()
      }).select().single()
      
      if (error) {
        console.error('Error migrating admin:', error)
      } else {
        adminIdMap[admin.id] = data.id
      }
    }

    // 3. Migrate Shoppers
    console.log('Migrating shoppers...')
    for (const shopper of mockData.mockShoppers) {
      const { data, error } = await supabase.from('shoppers').insert({
        name: shopper.name,
        email: shopper.email,
        password: shopper.password || 'demo2026',
        phone: shopper.primary_phone || shopper.phone,
        city: shopper.city,
        avatar: shopper.avatar,
        points: shopper.points,
        level: shopper.level,
        is_active: shopper.status === 'active',
        created_at: new Date().toISOString()
      }).select().single()
      
      if (error) {
        console.error('Error migrating shopper:', error)
      } else {
        shopperIdMap[shopper.id] = data.id
      }
    }

    // 4. Migrate Visits
    console.log('Migrating visits...')
    for (const visit of mockData.mockVisits) {
      // Find matching location id
      const { data: locData } = await supabase
        .from('locations')
        .select('id')
        .eq('name', visit.office_name)
        .eq('brand', visit.brand)
        .single()
      
      const { error } = await supabase.from('visits').insert({
        shopper_id: shopperIdMap[visit.shopper_id] || null,
        location_id: locData ? locData.id : null,
        brand: visit.brand,
        city: visit.city,
        location_name: visit.office_name,
        date: visit.visit_date,
        status: visit.status,
        score: visit.points_earned,
        issues_count: 0,
        notes: visit.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      if (error) console.error('Error migrating visit:', error)
    }

    // 5. Migrate Issues
    console.log('Migrating issues...')
    for (const issue of mockData.mockIssues) {
      const { error } = await supabase.from('issues').insert({
        id: issue.id,
        visit_id: issue.visitId,
        category: issue.category,
        description: issue.description,
        severity: issue.severity,
        status: issue.status,
        resolved_at: issue.resolvedAt || null,
        created_at: new Date().toISOString()
      })
      if (error) console.error('Error migrating issue:', error)
    }

    // 6. Migrate Notifications
    console.log('Migrating notifications...')
    for (const notif of mockData.mockNotifications) {
      const { error } = await supabase.from('notifications').insert({
        id: notif.id,
        user_role: 'admin',
        title: notif.title,
        message: notif.message,
        type: notif.type,
        is_read: notif.isRead,
        created_at: notif.createdAt || new Date().toISOString()
      })
      if (error) console.error('Error migrating notification:', error)
    }

    console.log('Migration completed successfully!')
  } catch (err) {
    console.error('Migration failed:', err)
  }
}

migrateData()
