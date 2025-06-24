import * as cs from '@cubist-labs/cubesigner-sdk'
import { getBytesCopy, Signature } from 'ethers'
import { TronWeb } from 'tronweb'
import { IMetadata } from './common/type'
const { BN } = require('bitcore-lib-doge/lib/crypto/bn')

const tronWeb = new TronWeb({
  fullHost: 'https://nile.trongrid.io',
})

function hexChar2byte(c: string) {
  let d: number | undefined

  if (c >= 'A' && c <= 'F') d = c.charCodeAt(0) - 'A'.charCodeAt(0) + 10
  else if (c >= 'a' && c <= 'f') d = c.charCodeAt(0) - 'a'.charCodeAt(0) + 10
  else if (c >= '0' && c <= '9') d = c.charCodeAt(0) - '0'.charCodeAt(0)

  if (typeof d === 'number') return d
  else throw new Error('The passed hex char is not a valid hex char')
}

function isHexChar(c: string) {
  if (
    (c >= 'A' && c <= 'F') ||
    (c >= 'a' && c <= 'f') ||
    (c >= '0' && c <= '9')
  ) {
    return 1
  }
  return 0
}
function hexStr2byteArray(str: string, strict = false) {
  let len = str.length

  if (strict) {
    if (len % 2) {
      str = `0${str}`
      len++
    }
  }
  const byteArray: number[] = []
  let d = 0
  let j = 0
  let k = 0

  for (let i = 0; i < len; i++) {
    const c = str.charAt(i)

    if (isHexChar(c)) {
      d <<= 4
      d += hexChar2byte(c)
      j++

      if (0 === j % 2) {
        byteArray[k++] = d
        d = 0
      }
    } else throw new Error('The passed hex char is not a valid hex string')
  }

  return byteArray
}
async function signTronRawTransaction(
  txID: string,
  userInfo: any,
  materialId: string,
  approveSession: any,
  paypin?: string
) {
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await oidcClient.org().getKey(`Key#Tron_${materialId}`)
  let resp = await key.signBlob({
    message_base64: Buffer.from(hexStr2byteArray(txID)).toString('base64'),
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
  const signature = resp.data().signature
  return signature
}

async function signTronTypeDaya(
  message: string,
  userInfo: any,
  materialId: string,
  approveSession: any,
  paypin?: string
) {
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await oidcClient.org().getKey(`Key#Tron_${materialId}`)
  let resp = await key.signBlob({
    message_base64: Buffer.from(getBytesCopy(message)).toString('base64'),
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
  const buf = Buffer.from(resp.data().signature.slice(2), 'hex')
  const r = buf.subarray(0, 32)
  const s = buf.subarray(32, 64)
  const v = buf[64]
  const rStr = r.toString('hex')
  const sStr = s.toString('hex')
  const vStr = (new BN(buf[64]).toNumber() + 27).toString(16)
  return '0x' + rStr + sStr + vStr.padStart(2, '0')
}

async function signTronMessage(
  message: string,
  userInfo: any,
  materialId: string,
  approveSession: any,
  paypin?: string
) {
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await oidcClient.org().getKey(`Key#Tron_${materialId}`)
  const messageDigest = tronWeb.utils.message.hashMessage(message)
  let resp = await key.signBlob({
    message_base64: Buffer.from(getBytesCopy(messageDigest)).toString('base64'),
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
  const buf = Buffer.from(resp.data().signature.slice(2), 'hex')
  const r = buf.subarray(0, 32)
  const s = buf.subarray(32, 64)
  const v = buf[64]
  const rHex = '0x' + r.toString('hex')
  const sHex = '0x' + s.toString('hex')
  return Signature.from({
    r: rHex,
    s: sHex,
    v: v,
  }).serialized
}

export { signTronRawTransaction, signTronTypeDaya, signTronMessage }
