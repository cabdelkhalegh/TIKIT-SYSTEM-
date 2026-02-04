import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tickets - List all tickets
export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request) {
  try {
    const body = await request.json()
    const { title, description, priority, userId } = body

    if (!title || !description || !userId) {
      return NextResponse.json(
        { error: 'Title, description, and userId are required' },
        { status: 400 }
      )
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority: priority || 'medium',
        userId,
      },
      include: {
        user: true,
      },
    })

    return NextResponse.json(ticket, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}
