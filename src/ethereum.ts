import * as cs from '@cubist-labs/cubesigner-sdk'
import { IMetadata } from './common/type'

export type Transaction = {
  to: `0x${string}`
  value?: string
  data?: `${string}`
  nonce?: number
  gas?: string
  gasPrice?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
}

export type RawTransaction = `0x${string}`

export type TypedData = {
  types: any
  domain: any
  primaryType: string
  message: any
}

function toHexPrefix(str: string) {
  if (str.startsWith('0x')) {
    return str
  } else {
    const num = Number(str)
    if (isNaN(num)) {
      throw new Error('error string')
    }
    return '0x' + num.toString(16)
  }
}

async function signEvmMessage(
  message: string,
  userInfo: any,
  materialId: string,
  approveSession: any,
  paypin?: string
) {
  const messageHashHex = message.startsWith('0x')
    ? message
    : '0x' + Buffer.from(message, 'utf-8').toString('hex')
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await oidcClient.org().getKey(`Key#${materialId}`)
  let resp = await key.signEip191({
    data: messageHashHex,
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
  return resp.data().signature
}

async function signEvmTypedData(
  typedData: TypedData,
  userInfo: string,
  materialId: string,
  approveSession: any,
  paypin?: string
) {
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await oidcClient.org().getKey(`Key#${materialId}`)
  let resp = await key.signEip712({
    chain_id: typedData?.domain?.chainId ? Number(typedData.domain.chainId) : 1,
    typed_data: typedData,
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
  return resp.data().signature
}

async function signEvmTransaction(
  transaction: Transaction,
  chainId: number,
  userInfo: any,
  materialId: string,
  approveSession: any,
  paypin?: string
) {
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await oidcClient.org().getKey(`Key#${materialId}`)
  let sig: any
  if (!!transaction.gasPrice) {
    sig = await key!.signEvm({
      chain_id: chainId,
      tx: {
        to: transaction.to,
        value: transaction?.value ? toHexPrefix(transaction.value) : undefined,
        data: transaction.data!,
        nonce: toHexPrefix(transaction.nonce!?.toString()),
        gas: transaction?.gas ? toHexPrefix(transaction.gas) : undefined,
        gasPrice: transaction?.gasPrice
          ? toHexPrefix(transaction.gasPrice)
          : undefined,
        type: '0x00',
      },
      metadata: paypin,
    })
  } else {
    sig = await key!.signEvm({
      chain_id: chainId,
      tx: {
        type: '0x02',
        to: transaction.to,
        value: transaction?.value ? toHexPrefix(transaction.value) : undefined,
        data: transaction.data,
        nonce: toHexPrefix(transaction.nonce!?.toString()),
        gas: transaction?.gas ? toHexPrefix(transaction.gas) : undefined,
        maxFeePerGas: transaction?.maxFeePerGas
          ? toHexPrefix(transaction.maxFeePerGas)
          : undefined,
        maxPriorityFeePerGas: transaction?.maxPriorityFeePerGas
          ? toHexPrefix(transaction.maxPriorityFeePerGas)
          : undefined,
      },
      metadata: paypin,
    })
  }
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
  return sig.data().rlp_signed_tx
}

export { signEvmMessage, signEvmTypedData, signEvmTransaction }
