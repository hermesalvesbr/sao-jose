import type { PublicPdvSaleResponse } from '@/types/api'

interface SerialPortInfo {
  usbVendorId?: number
  usbProductId?: number
}

interface SerialPortLike {
  open: (options: SerialOptionsLike) => Promise<void>
  close: () => Promise<void>
  getInfo: () => SerialPortInfo
  writable: WritableStream<Uint8Array> | null
}

interface SerialOptionsLike {
  baudRate: number
  dataBits?: 7 | 8
  stopBits?: 1 | 2
  parity?: 'none' | 'even' | 'odd'
  flowControl?: 'none' | 'hardware'
}

interface SerialManagerLike {
  requestPort: () => Promise<SerialPortLike>
  getPorts: () => Promise<SerialPortLike[]>
}

type ReceiptAlignment = 'left' | 'center' | 'right'

const RECEIPT_WIDTH = 32
const BAUD_RATES = [9600, 19200, 38400, 57600, 115200] as const
type BaudRate = typeof BAUD_RATES[number]
const ACCENT_MARKS_RE = /[\u0300-\u036F]/g
const DOUBLE_QUOTES_RE = /[“”]/g
const SINGLE_QUOTES_RE = /[‘’]/g
const NON_ASCII_RE = /[^\x20-\x7E]/g
const MULTI_SPACE_RE = /\s+/g

function getSerialManager(): SerialManagerLike | null {
  if (!import.meta.client || typeof navigator === 'undefined')
    return null

  const serial = (navigator as Navigator & { serial?: SerialManagerLike }).serial
  return serial ?? null
}

function stripAccents(value: string): string {
  return value
    .normalize('NFD')
    .replace(ACCENT_MARKS_RE, '')
    .replace(DOUBLE_QUOTES_RE, '"')
    .replace(SINGLE_QUOTES_RE, '\'')
}

function sanitizeLine(value: string): string {
  return stripAccents(value)
    .replace(NON_ASCII_RE, ' ')
    .replace(MULTI_SPACE_RE, ' ')
    .trim()
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function alignText(value: string, alignment: ReceiptAlignment = 'left'): string {
  const content = sanitizeLine(value).slice(0, RECEIPT_WIDTH)
  const padding = Math.max(0, RECEIPT_WIDTH - content.length)

  if (alignment === 'right')
    return `${' '.repeat(padding)}${content}`

  if (alignment === 'center') {
    const leftPad = Math.floor(padding / 2)
    const rightPad = padding - leftPad
    return `${' '.repeat(leftPad)}${content}${' '.repeat(rightPad)}`
  }

  return `${content}${' '.repeat(padding)}`
}

function divider(character = '-'): string {
  return character.repeat(RECEIPT_WIDTH)
}

function toBytes(lines: string[]): Uint8Array {
  const encoder = new TextEncoder()
  const content = lines.join('\n')
  return encoder.encode(content)
}

function concatChunks(...chunks: Array<number[] | Uint8Array>): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0

  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }

  return result
}

function escPosAlign(alignment: ReceiptAlignment): Uint8Array {
  const code = alignment === 'center' ? 1 : alignment === 'right' ? 2 : 0
  return Uint8Array.from([0x1B, 0x61, code])
}

function escPosInit(): Uint8Array {
  return Uint8Array.from([0x1B, 0x40])
}

function escPosBold(enabled: boolean): Uint8Array {
  return Uint8Array.from([0x1B, 0x45, enabled ? 1 : 0])
}

function escPosFeed(lines = 1): Uint8Array {
  return Uint8Array.from([0x1B, 0x64, Math.max(0, Math.min(lines, 10))])
}

function buildItemTickets(sale: PublicPdvSaleResponse): Uint8Array {
  const tickets = sale.items.map((item, index) => {
    const ticketLines = [
      alignText('Capela Sao Jose', 'center'),
      alignText(`Pedido ${sale.saleNumber ?? sale.saleId.slice(0, 8)}`, 'center'),
      alignText(`Item ${index + 1} de ${sale.items.length}`, 'center'),
      divider(),
      sanitizeLine(item.name).slice(0, RECEIPT_WIDTH),
      `Qtd: ${item.quantity}`,
      item.pointName ? `Entrega: ${sanitizeLine(item.pointName).slice(0, 21)}` : '',
      `Pagamento: ${sanitizeLine(sale.paymentMethod.toUpperCase())}`,
      `Valor: ${formatCurrency(item.totalPrice)}`,
      `Atendente: ${sanitizeLine(sale.operatorName).slice(0, 20)}`,
      `Emitido: ${new Date(sale.createdAt).toLocaleString('pt-BR')}`,
      divider(),
      alignText('Apresentar no balcao', 'center'),
      '',
    ].filter(Boolean)

    return concatChunks(
      escPosInit(),
      escPosAlign('center'),
      escPosBold(true),
      toBytes(ticketLines),
      escPosBold(false),
      escPosFeed(4),
    )
  })

  return concatChunks(...tickets)
}

export function useUsbEscPosPrinter() {
  const port = useState<SerialPortLike | null>('pdv-printer-port', () => null)
  const isConnected = useState<boolean>('pdv-printer-connected', () => false)
  const isConnecting = useState<boolean>('pdv-printer-connecting', () => false)
  const errorMessage = useState<string | null>('pdv-printer-error', () => null)
  const baudRate = useState<BaudRate>('pdv-printer-baud-rate', () => 9600)
  const preferredDevice = useState<SerialPortInfo | null>('pdv-printer-preferred-device', () => null)

  const isSupported = computed(() => Boolean(getSerialManager()))

  async function openPort(targetPort: SerialPortLike): Promise<void> {
    await targetPort.open({
      baudRate: baudRate.value,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      flowControl: 'none',
    })

    port.value = targetPort
    isConnected.value = true
    preferredDevice.value = targetPort.getInfo()
    errorMessage.value = null
  }

  async function connect(): Promise<void> {
    const serial = getSerialManager()
    if (!serial)
      throw new Error('Este navegador não conseguiu liberar a impressora.')

    isConnecting.value = true
    errorMessage.value = null

    try {
      const requestedPort = await serial.requestPort()
      await openPort(requestedPort)
    }
    catch (error) {
      isConnected.value = false
      errorMessage.value = error instanceof Error ? error.message : 'Não foi possível conectar à impressora.'
      throw error
    }
    finally {
      isConnecting.value = false
    }
  }

  async function reconnect(): Promise<boolean> {
    const serial = getSerialManager()
    if (!serial)
      return false

    const ports = await serial.getPorts()
    if (ports.length === 0)
      return false

    const favoritePort = preferredDevice.value
      ? ports.find((entry) => {
          const info = entry.getInfo()
          return info.usbVendorId === preferredDevice.value?.usbVendorId && info.usbProductId === preferredDevice.value?.usbProductId
        })
      : ports[0]

    if (!favoritePort)
      return false

    try {
      await openPort(favoritePort)
      return true
    }
    catch (error) {
      isConnected.value = false
      errorMessage.value = error instanceof Error ? error.message : 'Não foi possível reconectar à impressora.'
      return false
    }
  }

  async function disconnect(): Promise<void> {
    if (!port.value)
      return

    try {
      await port.value.close()
    }
    finally {
      port.value = null
      isConnected.value = false
    }
  }

  async function write(data: Uint8Array): Promise<void> {
    if (!port.value?.writable)
      throw new Error('Impressora não conectada.')

    const writer = port.value.writable.getWriter()

    try {
      await writer.write(data)
    }
    finally {
      writer.releaseLock()
    }
  }

  async function printSaleItemTickets(sale: PublicPdvSaleResponse): Promise<void> {
    const payload = buildItemTickets(sale)
    await write(payload)
  }

  return {
    isSupported,
    isConnected,
    isConnecting,
    errorMessage,
    baudRate,
    baudRateOptions: BAUD_RATES,
    connect,
    reconnect,
    disconnect,
    printSaleItemTickets,
  }
}
