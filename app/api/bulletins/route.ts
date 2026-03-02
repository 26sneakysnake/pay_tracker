import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year')

  const where = year
    ? {
        periodStart: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      }
    : {}

  try {
    const bulletins = await prisma.bulletin.findMany({
      where,
      orderBy: { periodStart: 'asc' },
    })
    return NextResponse.json(bulletins)
  } catch (error) {
    console.error('GET /api/bulletins error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.periodStart) body.periodStart = new Date(body.periodStart)
    if (body.periodEnd) body.periodEnd = new Date(body.periodEnd)

    const bulletin = await prisma.bulletin.create({ data: body })
    return NextResponse.json(bulletin, { status: 201 })
  } catch (error) {
    console.error('POST /api/bulletins error:', error)
    return NextResponse.json({ error: 'Create failed' }, { status: 500 })
  }
}
