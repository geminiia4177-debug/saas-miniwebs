import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export interface GenerateCFDIRequest {
  businessId: string;
  amount: number;
  customerRfc?: string; // RFC for Mexico
  customerName?: string;
  customerEmail?: string;
}

export interface GenerateCFDIResponse {
  success: boolean;
  uuid?: string; // Folio Fiscal (UUID)
  error?: string;
}

/**
 * Servicio Fachada para Facturación (Ej. Facturama / Gigstack)
 * Actualment en modo simulación (MOCK)
 */
export async function generateCFDI(data: GenerateCFDIRequest): Promise<GenerateCFDIResponse> {
  try {
    const business = await prisma.business.findUnique({
      where: { id: data.businessId },
      select: { id: true, paymentData: true }
    });

    if (!business) {
      throw new Error("Business not found");
    }

    // TODO: Aquí iría la llamada real HTTP al proveedor (Facturama, etc.)
    // Ejemplo: const res = await axios.post('https://api.facturama.mx/cfdi', data, { headers: { ... } });
    
    // SIMULACIÓN:
    // Generar un UUID falso imitando el formato de un Folio Fiscal del SAT
    const simulatedUuid = randomUUID().toUpperCase();
    
    // Recuperar el paymentData actual (o inicializarlo)
    const paymentData: any = business.paymentData || {};
    
    // Guardar el historial de facturas
    if (!paymentData.invoices) {
      paymentData.invoices = [];
    }
    
    paymentData.invoices.push({
      date: new Date().toISOString(),
      amount: data.amount,
      uuid: simulatedUuid,
      status: "TIMBRADO" // Timbrado exitosamente
    });

    // Guardar en base de datos
    await prisma.business.update({
      where: { id: data.businessId },
      data: {
        paymentData
      }
    });

    return {
      success: true,
      uuid: simulatedUuid
    };
  } catch (error: any) {
    console.error("Error generating CFDI:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
