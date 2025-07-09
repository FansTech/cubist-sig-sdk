import * as bitcoin from 'bitcoinjs-lib'
import secp256k1 from 'secp256k1'
import * as cs from '@cubist-labs/cubesigner-sdk'
const SignatureNew = require('elliptic/lib/elliptic/ec/signature')
import { ec as EC } from 'elliptic'
import axios from 'axios'
import BigNumber from 'bignumber.js'
import { IMetadata } from './common/type'
export const secp256k1New = new EC('secp256k1')
const bitcorelibdoge = require('bitcore-lib-doge')
const Signature = require('bitcore-lib-doge/lib/crypto/signature')
const PublicKeyHashInput = require('bitcore-lib-doge/lib/transaction/input/publickeyhash')
const PublicKey = require('bitcore-lib-doge/lib/publickey')
const BufferUtil = require('bitcore-lib-doge/lib/util/buffer')
const { BN } = require('bitcore-lib-doge/lib/crypto/bn')
const { fromCompact } = require('bitcore-lib-doge/lib/crypto/signature')
import { CURVE } from '@noble/secp256k1'

function hexSigToCompact(sig: any) {
  const buf = Buffer.from(sig.slice(2), 'hex')
  const r = buf.subarray(0, 32)
  const s = buf.subarray(32, 64)
  const v = new BN(buf[64]).toNumber() + 27
  const sBigInt = BigInt('0x' + s.toString('hex'))
  const halfN = CURVE.n >> 1n

  if (sBigInt > halfN) {
    throw new Error('Signature s value is not low-s (s > n/2)')
  }
  return Buffer.concat([Buffer.from([v]), r, s])
}

function reverseBuffer(buffer: any) {
  const reversed = Buffer.alloc(buffer.length)
  for (let i = 0; i < buffer.length; i++) {
    reversed[i] = buffer[buffer.length - 1 - i]
  }
  return reversed
}

async function getUnspentUtxos(rpc: string, address: string) {
  const result = await axios.get(
    `${rpc}/address/${address}/?unspent=true&limit=0`
  )
  return result.data.filter((item: any) => item.mintHeight > 0)
}

async function buildTx(
  from: string,
  to: string,
  rpcUrl: string,
  fee: string,
  amount: number
) {
  const unspent = await getUnspentUtxos(rpcUrl, from)
  const unspentOutputs = unspent.map((tx: any) => ({
    address: from,
    txId: tx.mintTxid,
    outputIndex: tx.mintIndex,
    script: tx.script,
    satoshis: tx.value,
  }))
  const amountInBigStr = new BigNumber(amount)
    .times(new BigNumber(10).pow(8))
    .toFixed(0)
  const tx = new bitcorelibdoge.Transaction()
    .from(unspentOutputs)
    .to(to, Number(amountInBigStr))
    .fee(Number(fee))
    .change(from)
  return tx
}

async function signDogeMessage(
  message: string,
  userInfo: any,
  materialId: string,
  approveSession: any,
  paypin?: string
) {
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await oidcClient.org().getKey(`Key#Doge_${materialId}`)
  const messageLength = Buffer.from(new Uint8Array([message.length]))
  const messageBuffer = Buffer.from(message)
  const prefix = Buffer.from('\x19Dogecoin Signed Message:\n')
  const fullMessage = Buffer.concat([prefix, messageLength, messageBuffer])
  const messageHash = bitcoin.crypto.sha256(fullMessage)
  const publicKey = secp256k1.publicKeyConvert(
    Buffer.from(key!.publicKey.slice(2), 'hex'),
    true
  )
  let resp = await key!.signBlob({
    message_base64: messageHash.toString('base64'),
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
  const signatureCubist = new SignatureNew({ r, s })
  return {
    signature: Buffer.from(signatureCubist.toDER()).toString('hex'),
    publicKey: Buffer.from(publicKey).toString('hex'),
  }
}

async function signDogeByRawTx(
  rawTx: string,
  userInfo: any,
  materialId: string,
  approveSession: any,
  paypin?: string
) {
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await oidcClient.org().getKey(`Key#Doge_${materialId}`)
  const publicKey = secp256k1.publicKeyConvert(
    Buffer.from(key!.publicKey.slice(2), 'hex'),
    true
  )
  const tx = new bitcorelibdoge.Transaction(rawTx)
  const hashData = bitcorelibdoge.crypto.Hash.sha256ripemd160(publicKey)
  const sigtype = Signature.SIGHASH_ALL
  for (let index = 0; index < tx.inputs.length; index++) {
    const input = tx.inputs[index]
    if (input instanceof PublicKeyHashInput) {
      var script
      if (input.output.script.isScriptHashOut()) {
        script = input.getRedeemScript(new PublicKey(publicKey))
      } else {
        script = input.output.script
      }
      if (script && BufferUtil.equals(hashData, script.getPublicKeyHash())) {
        const hashbuf = bitcorelibdoge.Transaction.Sighash.sighash(
          tx,
          sigtype,
          index,
          input.output.script
        )
        let resp = await key!.signBlob({
          message_base64: reverseBuffer(Buffer.from(hashbuf)).toString(
            'base64'
          ),
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
        const compact = hexSigToCompact(sig)
        const signature = fromCompact(compact)
        tx.applySignature(
          new bitcorelibdoge.Transaction.Signature({
            publicKey: publicKey,
            prevTxId: input.prevTxId,
            outputIndex: input.outputIndex,
            inputIndex: index,
            signature: signature,
            sigtype: sigtype,
          })
        )
      }
    }
  }
  return tx.serialize()
}

async function signDogeTransaction(
  userInfo: any,
  rpcUrl: string,
  from: string,
  to: string,
  fee: string,
  amount: number,
  materialId: string,
  approveSession: any,
  paypin?: string
) {
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await await oidcClient.org().getKey(`Key#Doge_${materialId}`)
  const publicKey = secp256k1.publicKeyConvert(
    Buffer.from(key!.publicKey.slice(2), 'hex'),
    true
  )
  const tx = await buildTx(from, to, rpcUrl, fee, amount)
  const hashData = bitcorelibdoge.crypto.Hash.sha256ripemd160(publicKey)
  const sigtype = Signature.SIGHASH_ALL
  for (let index = 0; index < tx.inputs.length; index++) {
    const input = tx.inputs[index]
    if (input instanceof PublicKeyHashInput) {
      var script
      if (input.output.script.isScriptHashOut()) {
        script = input.getRedeemScript(new PublicKey(publicKey))
      } else {
        script = input.output.script
      }
      if (script && BufferUtil.equals(hashData, script.getPublicKeyHash())) {
        const hashbuf = bitcorelibdoge.Transaction.Sighash.sighash(
          tx,
          sigtype,
          index,
          input.output.script
        )
        let resp = await key!.signBlob({
          message_base64: reverseBuffer(Buffer.from(hashbuf)).toString(
            'base64'
          ),
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
        const compact = hexSigToCompact(sig)
        const signature = fromCompact(compact)
        tx.applySignature(
          new bitcorelibdoge.Transaction.Signature({
            publicKey: publicKey,
            prevTxId: input.prevTxId,
            outputIndex: input.outputIndex,
            inputIndex: index,
            signature: signature,
            sigtype: sigtype,
          })
        )
      }
    }
  }
  return tx.serialize()
}

export { signDogeTransaction, signDogeMessage, signDogeByRawTx }
