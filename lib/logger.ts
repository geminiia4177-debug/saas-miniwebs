export const auditLog = (action: string, payload: any) => {
  // En producción, esto debería ir a un sistema como Datadog, ELK, o una tabla de DB dedicada.
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    payload,
    level: "AUDIT"
  };
  
  // Imprimir de manera que sea fácilmente parseable (JSON stream)
  console.log(JSON.stringify(logEntry));
};
