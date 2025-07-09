import * as cs from '@cubist-labs/cubesigner-sdk'
import TonWeb from 'tonweb'
import { IMetadata } from './common/type'

const tonRpc: string = 'https://toncenter.com/api/v2/jsonRPC'
const tonTestnetRpc: string = 'https://testnet.toncenter.com/api/v2/jsonRPC'

function getTonWebProvider(isTestnet: boolean = false) {
  if (isTestnet) {
    return new TonWeb(new TonWeb.HttpProvider(tonTestnetRpc))
  }
  return new TonWeb(new TonWeb.HttpProvider(tonRpc))
}

async function signTonTransaction(
  signingMessageBoc: string,
  materialId: string,
  userInfo: any,
  stateInitBoc: string,
  isTestnet: boolean = false,
  approveSession: any,
  paypin?: string
) {
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await oidcClient
    .org()
    .getKeyByMaterialId(cs.Ed25519.Ton, materialId!)
  const tonWeb = getTonWebProvider(isTestnet)
  const signingMessage = tonWeb.boc.Cell.oneFromBoc(signingMessageBoc)
  let resp = await key.signBlob({
    message_base64: tonWeb.utils.bytesToBase64(await signingMessage.hash()),
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
  const body = new tonWeb.boc.Cell()
  body.bits.writeBytes(Buffer.from(signature.substring(2), 'hex'))
  body.writeCell(signingMessage)
  let stateInit = null
  if (stateInitBoc && stateInitBoc.length > 0) {
    stateInit = tonWeb.boc.Cell.oneFromBoc(stateInitBoc)
  }
  const WalletClass = tonWeb.wallet.all['v4R2']
  const wallet = new WalletClass(tonWeb.provider, {
    publicKey: tonWeb.utils.hexToBytes(key.materialId),
    wc: 0,
  })
  const selfAddress = await wallet.getAddress()
  const header = TonWeb.Contract.createExternalMessageHeader(selfAddress)
  // @ts-ignore
  const message = TonWeb.Contract.createCommonMsgInfo(header, stateInit, body)
  return tonWeb.utils.bytesToBase64(await message.toBoc(false))
}

async function signTonMessage(
  materialId: string,
  userInfo: any,
  msg: string,
  approveSession: any,
  paypin?: string
) {
  const base64Message = Buffer.from(msg, 'hex').toString('base64')
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await oidcClient
    .org()
    .getKeyByMaterialId(cs.Ed25519.Ton, materialId!)
  let resp = await key.signBlob({
    message_base64: base64Message,
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
  return sig.substring(2, sig.length)
}

export { signTonTransaction, signTonMessage, getTonWebProvider }
