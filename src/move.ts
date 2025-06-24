import * as cs from '@cubist-labs/cubesigner-sdk'
import {
  Deserializer,
  generateSigningMessageForTransaction,
  SimpleTransaction,
} from '@aptos-labs/ts-sdk'
import { IMetadata } from './common/type'

async function signMoveTransaction(
  rawTransaction: string,
  userInfo: any,
  materialId: string,
  approveSession: any,
  paypin?: string
) {
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const binaryData = Uint8Array.from(Buffer.from(rawTransaction, 'hex'))
  const deserializer = new Deserializer(binaryData)
  const deserializedTransaction = SimpleTransaction.deserialize(deserializer)
  const message = generateSigningMessageForTransaction(deserializedTransaction)
  const key = await oidcClient.org().getKey(`Key#Aptos_${materialId}`)
  let sig = await key.signBlob({
    message_base64: Buffer.from(message).toString('base64'),
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
  return {
    publicKey: key.publicKey.slice(2),
    sig: sig.data().signature.slice(2),
  }
}
async function signMoveMessage(
  message: string,
  userInfo: any,
  materialId: string,
  approveSession: any,
  paypin?: string
) {
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await oidcClient.org().getKey(`Key#Aptos_${materialId}`)
  let sig = await key.signBlob({
    message_base64: Buffer.from(message).toString('base64'),
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
  return sig.data().signature.slice(2)
}

export { signMoveTransaction, signMoveMessage }
