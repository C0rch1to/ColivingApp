# Requerimientos y Especificación del Sistema - Coliving App

Sistema de gestión local y minimalista para el control de **Habitaciones**, **Inquilinos**, **Stock e Inventario**, y **Lectura de Medidores** para las sucursales **Centro** y **Boulevares**.

---

## 1. Objetivos del Sistema
1. **Control de Habitaciones e Inquilinos**:
   - Seguimiento del estado de cada habitación (Disponible, Ocupada, Reservada, En Mantenimiento) por sucursal.
   - Registro detallado de inquilinos (Nombre, DNI, teléfono/WhatsApp, email, fecha de ingreso, fecha de egreso estimada, valor de cuota, estado de pago).
   - Control y emisión del **Acta de Entrega de Vajilla Personal** (10 ítems oficiales según acta impresa).
   - Proceso ágil de Check-in (ingreso) y Check-out (egreso).

2. **Control de Stock e Inventario**:
   - Registro de insumos y consumibles precargados de la planilla física (`planilla-stock.jpg`).
   - Control de vajilla y equipamiento común (`stock coliving centro.xlsx`).
   - Cálculo automático de:
     $$\text{Stock Actual} = \text{Stock Inicial} + \text{Agregado/Entradas} - \text{Salidas/Consumo}$$
   - Alertas visuales de stock bajo o agotado para reposición.
   - Historial de movimientos (ingresos, egresos, ajustes).

3. **Lecturas de Medidores y Servicios**:
   - Registro de lecturas para: Medidor Luz General 1, Medidor Luz General 2 y Medidor Gas Natural.
   - Cálculo automático del consumo del período (diferencia entre lectura actual y anterior).

4. **Persistencia Local y Respaldo**:
   - Almacenamiento 100% local en el navegador mediante `LocalStorage`.
   - Exportación de copia de seguridad en formato `.json` descargable con un solo clic.
   - Importación y restauración de copias de seguridad.
   - Exportación de planilla de inventario a formato CSV/Excel.
   - Vista de impresión profesional optimizada para papel (Actas de Entrega y Planillas de Inventario).

5. **Estética y Diseño**:
   - Enfoque minimalista, moderno y pulcro (blancos, escala de grises, negro carbón y acentos funcionales sutiles).
   - Integración del logotipo oficial de la bicicleta (`Logo-bicicleta.jpg`) y sello institucional (`Logo.jpg`).
   - Totalmente responsivo (adaptado para celular, tablet y computadora de escritorio).

---

## 2. Sucursales
- **Sucursal Centro**
- **Sucursal Boulevares**
- Filtro global ("Todas las sucursales") o individual para visualizar y operar de forma unificada o segmentada.

---

## 3. Ítems de Stock Precargados (según planilla-stock.jpg y registros anexos)
### A. Insumos de Limpieza y Consumibles
- Papel Higiénico 300 m x rollo
- Papel de cocina rollo
- Detergente litro
- Champú de manos litro
- Lavandina sobres
- Limpia pisos sobres
- Limpia vidrios litro
- Odex litros
- Lavandina en gel litros
- Cif crema litros
- Trapo de piso (sin usar)
- Guantes personal
- Esponjas de acero unidades
- Esponja común unidades
- Esponja verde unidades
- Vallerinas unidades
- Bolsas residuos unidades 45x60
- Bolsas residuos unidades 60x90
- Escobillón con palo
- Escurridor con palo
- Dosificadores
- Cortina de baño
- Garrafas

### B. Medidores y Servicios
- Medidor Luz General 1 (Lectura anterior: 9.219 / Actual: 29.895)
- Medidor Luz General 2 (Lectura anterior: 10.009)
- Medidor Gas Natural (Lectura anterior: 15.703,465)

### C. Vajilla de Uso Personal (Acta oficial de entrega a inquilinos)
1. Plato playo (1 unidad)
2. Plato hondo (1 unidad)
3. Plato de postre (1 unidad)
4. Taza con plato (1 unidad)
5. Vaso de vidrio (1 unidad)
6. Cuchillo (1 unidad)
7. Tenedor (1 unidad)
8. Cuchara sopera (1 unidad)
9. Cuchara de postre (1 unidad)
10. Bandeja (1 unidad)

### D. Equipamiento y Cocina General
- Tablas de picar, ollas (chica, mediana, grande), sartenes, pavas eléctricas, microondas, hornos/cocinas, heladeras, etc.

---

## 4. Estructura de Datos (JSON LocalStorage)
```json
{
  "version": "1.0",
  "lastUpdated": "2026-11-25T...",
  "activeBranch": "all",
  "rooms": [...],
  "stock": [...],
  "movements": [...],
  "meterReadings": [...]
}
```
