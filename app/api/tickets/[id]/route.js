import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tickets/[id] - Get a single ticket
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: true,
        comments: true,
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 })
  }
}

// PATCH /api/tickets/[id] - Update a ticket
export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, status, priority } = body

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
      },
      include: {
        user: true,
      },
    })

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}

// DELETE /api/tickets/[id] - Delete a ticket
export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    await prisma.ticket.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Ticket deleted successfully' })
  } catch (error) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 })
  }
}
