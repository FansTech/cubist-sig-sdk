import * as cs from '@cubist-labs/cubesigner-sdk'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import { IMetadata } from './common/type'

async function signSolanaTransaction(
  rawTransaction: string,
  userInfo: any,
  materialId: string,
  approveSession: any,
  paypin?: string
) {
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const transaction = VersionedTransaction.deserialize(
    Buffer.from(rawTransaction, 'hex')
  )
  const key = await oidcClient.org().getKey(`Key#Solana_${materialId}`)
  const fromPublicKey = new PublicKey(key.materialId)
  let resp = await key!.signSolana({
    message_base64: Buffer.from(transaction.message.serialize()).toString(
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
  const sigBytes = Buffer.from(sig.slice(2), 'hex')
  transaction.addSignature(fromPublicKey, new Uint8Array(sigBytes))
  return Buffer.from(transaction.serialize()).toString('hex')
}

async function signSolanaMessage(
  userInfo: any,
  msg: string,
  materialId: string,
  approveSession: any,
  paypin?: string
) {
  const message = Buffer.from(msg)
  const prefix = Buffer.from('\xffsolana offchain')
  const prefixedMessage = Buffer.concat([prefix, message])
  const base64Message = prefixedMessage.toString('base64')
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await oidcClient.org().getKey(`Key#Solana_${materialId}`)
  let sig = await key.signBlob({
    message_base64: base64Message,
    metadata: paypin,
  })
  if (sig.requiresMfa()) {
    const approveClient = await cs.CubeSignerClient.create(approveSession)
    const approvedMfa = await approveClient
      .org()
      .getMfaRequest(sig.mfaId()!)
      .approve()
    const receipt = await approvedMfa.receipt()
    sig = await sig.execWithMfaApproval({
      ...receipt!,
    })
  }
  const signature = sig.data().signature
  return signature.substring(2, signature.length)
}

export { signSolanaTransaction, signSolanaMessage }
