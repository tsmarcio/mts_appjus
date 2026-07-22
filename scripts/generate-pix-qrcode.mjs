import { writeFile } from 'node:fs/promises'
import QRCode from 'qrcode'

function field(id, value) {
  return `${id}${String(value.length).padStart(2, '0')}${value}`
}

function crc16(payload) {
  let crc = 0xffff

  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0')
}

const pixKey = '+5521964976686'
const amount = '29.99'
const description = 'MTS AppJus acesso'
const merchantName = 'MTSINFORJ'
const merchantCity = 'RIO DE JANEIRO'
const txid = 'MTSAPPJUS'

const merchantAccount = field('00', 'br.gov.bcb.pix') + field('01', pixKey) + field('02', description)
const additionalData = field('05', txid)
const payloadWithoutCrc = [
  field('00', '01'),
  field('26', merchantAccount),
  field('52', '0000'),
  field('53', '986'),
  field('54', amount),
  field('58', 'BR'),
  field('59', merchantName),
  field('60', merchantCity),
  field('62', additionalData),
  '6304',
].join('')
const payload = `${payloadWithoutCrc}${crc16(payloadWithoutCrc)}`

const svg = await QRCode.toString(payload, {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 2,
  color: {
    dark: '#081016',
    light: '#ffffff',
  },
})

await writeFile('public/payments/pix-copia-e-cola.txt', `${payload}\n`)
await writeFile('public/payments/pix-mtsappjus.svg', svg)

console.log(payload)
