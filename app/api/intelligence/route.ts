import { NextResponse } from "next/server";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

interface ClientStat {
  name: string;
  phone: string;
  visits: number;
  lastVisit: Date;
  firstVisit: Date;
  services: Map<string, number>;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "Falta businessId" }, { status: 400 });
    }

    // Tenancy authorization check
    const { error: authError } = await requireBusinessOwner(businessId);
    if (authError) return authError;

    // Limit to the last 6 months and a maximum of 5000 appointments
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: businessId,
        status: { in: ["COMPLETED", "CONFIRMED"] },
        date: { gte: sixMonthsAgo }
      },
      orderBy: { date: "desc" },
      take: 5000
    });

    // 1. Client Analysis (Group by Phone)
    const clientMap = new Map<string, ClientStat>();
    
    appointments.forEach(appt => {
      if (!appt.clientPhone) return;
      const phone = appt.clientPhone;
      
      if (!clientMap.has(phone)) {
        clientMap.set(phone, {
          name: appt.clientName,
          phone: phone,
          visits: 0,
          lastVisit: appt.date,
          firstVisit: appt.date,
          services: new Map<string, number>()
        });
      }
      
      const client = clientMap.get(phone)!;
      client.visits += 1;
      client.firstVisit = appt.date;
      if (appt.serviceName) {
        client.services.set(appt.serviceName, (client.services.get(appt.serviceName) || 0) + 1);
      }
    });

    const now = new Date();
    const clients = Array.from(clientMap.values()).map(c => {
      // Find favorite service
      let favoriteService = "";
      let maxServiceVisits = 0;
      for (const [service, count] of Array.from(c.services.entries() as IterableIterator<[string, number]>)) {
        if ((count as number) > maxServiceVisits) {
          maxServiceVisits = count as number;
          favoriteService = service as string;
        }
      }

      const daysSinceLastVisit = Math.floor((now.getTime() - new Date(c.lastVisit).getTime()) / (1000 * 3600 * 24));
      
      return {
        ...c,
        favoriteService,
        daysSinceLastVisit
      };
    });

    // Segment Clients
    // Inactive: > 45 days since last visit, but have visited at least twice (so they aren't just one-offs)
    const inactiveClients = clients.filter(c => c.daysSinceLastVisit > 45 && c.visits > 1);
    
    // VIP: Top clients by visit count (minimum 3 visits)
    const vipClients = [...clients].filter(c => c.visits >= 3).sort((a, b) => b.visits - a.visits).slice(0, 10);

    // 2. Schedule Analysis
    // Find days/hours with least appointments
    const dayCounts = [0,0,0,0,0,0,0]; // Sun-Sat
    const hourCounts = new Array(24).fill(0);

    appointments.forEach(appt => {
      const d = new Date(appt.date);
      dayCounts[d.getDay()] += 1;
      hourCounts[d.getHours()] += 1;
    });

    // Find the day with the minimum appointments (excluding days with 0 as they might be closed)
    let minDay = -1;
    let minDayCount = Infinity;
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    
    dayCounts.forEach((count, i) => {
      if (count > 0 && count < minDayCount) {
        minDayCount = count;
        minDay = i;
      }
    });

    return NextResponse.json({
      totalClients: clients.length,
      totalAppointments: appointments.length,
      inactiveClients,
      vipClients,
      weakestDay: minDay !== -1 ? { name: dayNames[minDay], count: minDayCount } : null,
    });

  } catch (error) {
    console.error("Error in BI Engine:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
