import * as cs from '@cubist-labs/cubesigner-sdk'
const Signature = require('@okxweb3/crypto-lib/dist/elliptic/ec/signature')
const { ec } = require('@okxweb3/crypto-lib/dist/elliptic')
const { base } = require('@okxweb3/crypto-lib')
const ecNew = new ec('secp256k1')
const MAGIC_BYTES = Buffer.from('Bitcoin Signed Message:\n')
import { IMetadata } from './common/type'

// function doubleSha256(data: any) {
//   return crypto
//     .createHash('sha256')
//     .update(crypto.createHash('sha256').update(data).digest())
//     .digest()
// }

async function doubleSha256(data: any) {
  // 将数据转换为 ArrayBuffer
  let buffer
  if (typeof data === 'string') {
    buffer = new TextEncoder().encode(data) // 字符串转 UTF-8 的 Uint8Array
  } else if (data instanceof ArrayBuffer) {
    buffer = data
  } else if (ArrayBuffer.isView(data)) {
    buffer = data.buffer // 处理 TypedArray 或 DataView
  } else {
    throw new TypeError(
      'Unsupported data type. Use string, ArrayBuffer, or BufferSource.'
    )
  }

  // 第一次 SHA-256 哈希
  const firstHash = await crypto.subtle.digest('SHA-256', buffer)
  // 第二次 SHA-256 哈希
  const secondHash = await crypto.subtle.digest('SHA-256', firstHash)

  // 返回十六进制字符串（与 Node.js 的 .digest('hex') 行为一致）
  return Array.from(new Uint8Array(secondHash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function toCompact(i: any, signature: any, compressed: any) {
  if (!(i === 0 || i === 1 || i === 2 || i === 3)) {
    throw new Error('i must be equal to 0, 1, 2, or 3')
  }
  let val = i + 27 + 4
  if (!compressed) {
    val = val - 4
  }
  return Buffer.concat([Uint8Array.of(val), Uint8Array.from(signature)])
}

function varintBufNum(n: any) {
  let buf
  if (n < 253) {
    buf = Buffer.alloc(1)
    buf.writeUInt8(n, 0)
  } else if (n < 0x10000) {
    buf = Buffer.alloc(1 + 2)
    buf.writeUInt8(253, 0)
    buf.writeUInt16LE(n, 1)
  } else if (n < 0x100000000) {
    buf = Buffer.alloc(1 + 4)
    buf.writeUInt8(254, 0)
    buf.writeUInt32LE(n, 1)
  } else {
    buf = Buffer.alloc(1 + 8)
    buf.writeUInt8(255, 0)
    buf.writeInt32LE(n & -1, 1)
    buf.writeUInt32LE(Math.floor(n / 0x100000000), 5)
  }
  return buf
}

function getKey(
  keyType:
    | 'p2pkh'
    | 'p2pkh_test'
    | 'p2wpkh'
    | 'p2wpkh_test'
    | 'p2tr'
    | 'p2tr_test'
    | 'p2sh'
    | 'p2sh_test',
  materialId: string
) {
  switch (keyType) {
    case 'p2pkh':
      return `Key#BtcLegacy_${materialId}`

    case 'p2pkh_test':
      return `Key#BtcLegacyTest_${materialId}`

    case 'p2wpkh':
      return `Key#Btc_${materialId}`

    case 'p2wpkh_test':
      return `Key#BtcTest_${materialId}`

    case 'p2tr':
      return `Key#BtcTaproot_${materialId}`

    case 'p2tr_test':
      return `Key#BtcTaprootTest_${materialId}`

    case 'p2sh':
      return `Key#Btc_${materialId}`

    case 'p2sh_test':
      return `Key#BtcTest_${materialId}`
  }
}

async function signPsbt(
  psbt: string,
  materialId: string,
  userInfo: any,
  keyType:
    | 'p2pkh'
    | 'p2pkh_test'
    | 'p2wpkh'
    | 'p2wpkh_test'
    | 'p2tr'
    | 'p2tr_test'
    | 'p2sh'
    | 'p2sh_test',
  approveSession: any,
  paypin?: string
) {
  const psbtSignRequest: cs.PsbtSignRequest = {
    psbt: psbt,
    sign_all_scripts: false,
    metadata: paypin,
  }
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await oidcClient.org().getKey(getKey(keyType, materialId))
  let psbtSignResponse = await key.signPsbt(psbtSignRequest)
  if (psbtSignResponse.requiresMfa()) {
    const approveClient = await cs.CubeSignerClient.create(approveSession)
    const approvedMfa = await approveClient
      .org()
      .getMfaRequest(psbtSignResponse.mfaId()!)
      .approve()
    const receipt = await approvedMfa.receipt()
    psbtSignResponse = await psbtSignResponse.execWithMfaApproval({
      ...receipt!,
    })
  }
  return psbtSignResponse.data().psbt
  // return psbtSignResponse.data().psbt
}

async function signBtcMessage(
  message: string,
  materialId: string,
  userInfo: any,
  isP2sh: boolean,
  keyType:
    | 'p2pkh'
    | 'p2pkh_test'
    | 'p2wpkh'
    | 'p2wpkh_test'
    | 'p2tr'
    | 'p2tr_test'
    | 'p2sh'
    | 'p2sh_test',
  approveSession: any,
  paypin?: string
) {
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const apiClient = oidcClient.apiClient
  const key = await oidcClient.org().getKey(getKey(keyType, materialId))
  let resp = await apiClient.signBtcMessage(key, {
    data: message,
    is_p2sh: isP2sh,
    metadata: paypin,
  })
  if (resp.requiresMfa()) {
    const approveClient = await cs.CubeSignerClient.create(approveSession)
    const approvedMfa = await approveClient
      .org()
      .getMfaRequest(resp.mfaId()!)
      .approve()
    const receipt = await approvedMfa.receipt()
    resp = await resp.execWithMfaApproval({
      ...receipt!,
    })
  }
  return resp.data().sig
}

async function magicHash(message: any, messagePrefix?: any) {
  const messagePrefixBuffer = messagePrefix
    ? Buffer.from(messagePrefix, 'utf8')
    : MAGIC_BYTES
  const prefix1 = varintBufNum(messagePrefixBuffer.length)
  const messageBuffer = Buffer.from(message)
  const prefix2 = varintBufNum(messageBuffer.length)
  const buf = Buffer.concat([
    prefix1,
    messagePrefixBuffer,
    prefix2,
    messageBuffer,
  ])

  return doubleSha256(buf) // 用 Node.js crypto 计算双重 SHA-256
}

async function signBabylonMessage(
  materialId: string,
  userInfo: any,
  message: string,
  keyType:
    | 'p2pkh'
    | 'p2pkh_test'
    | 'p2wpkh'
    | 'p2wpkh_test'
    | 'p2tr'
    | 'p2tr_test',
  approveSession: any,
  paypin?: string
) {
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await oidcClient.org().getKey(getKey(keyType, materialId))
  const hash = await magicHash(message)
  let resp = await key!.signBlob({
    message_base64: Buffer.from(hash).toString('base64'),
    metadata: paypin,
  })
  if (resp.requiresMfa()) {
    const approveClient = await cs.CubeSignerClient.create(approveSession)
    const approvedMfa = await approveClient
      .org()
      .getMfaRequest(resp.mfaId()!)
      .approve()
    const receipt = await approvedMfa.receipt()
    resp = await resp.execWithMfaApproval({
      ...receipt!,
    })
  }
  const sig = resp.data().signature
  const buf = Buffer.from(sig.slice(2), 'hex')
  const r = buf.subarray(0, 32)
  const s = buf.subarray(32, 64)
  const v = buf[64]
  const signatureCubist = new Signature(ecNew.curve, {
    r,
    s,
    recoveryParam: buf[64],
  })
  return base.toBase64(toCompact(v, signatureCubist.toBytes(), true))
}

export { signBabylonMessage, signBtcMessage, signPsbt }
