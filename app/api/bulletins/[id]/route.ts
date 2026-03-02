import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bulletin = await prisma.bulletin.findUnique({
      where: { id: params.id },
    })
    if (!bulletin) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(bulletin)
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    if (body.periodStart) body.periodStart = new Date(body.periodStart)
    if (body.periodEnd) body.periodEnd = new Date(body.periodEnd)

    // Remove id from update data
    const { id: _id, createdAt: _ca, ...updateData } = body

    const updated = await prisma.bulletin.update({
      where: { id: params.id },
      data: updateData,
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/bulletins/[id] error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.bulletin.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/bulletins/[id] error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
