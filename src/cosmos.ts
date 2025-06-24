import { AuthInfo, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import { PubKey } from 'cosmjs-types/cosmos/crypto/secp256k1/keys'
import * as cs from '@cubist-labs/cubesigner-sdk'
import secp256k1 from 'secp256k1'
import { makeSignBytes } from '@cosmjs/proto-signing'
import { Secp256k1, sha256 } from '@cosmjs/crypto'
import { encodeSecp256k1Signature, makeSignDoc } from '@cosmjs/amino'
import { escapeHTML, sortedJsonByKeyStringify } from '@keplr-wallet/common'
import { IMetadata } from './common/type'

function base64ToUint8Array(base64: string) {
  const buffer = Buffer.from(base64, 'base64')
  return new Uint8Array(buffer)
}

function uint8ArrayToBase64(uint8Array: any) {
  const buffer = Buffer.from(uint8Array)
  return buffer.toString('base64')
}
async function signCosmosTransaction(
  userInfo: any,
  signDoc: any,
  materialId: string,
  approveSession: any,
  paypin?: string
) {
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await oidcClient.org().getKey(`Key#Cosmos_${materialId}`)
  signDoc.authInfoBytes = base64ToUint8Array(signDoc.authInfoBytes)
  signDoc.bodyBytes = base64ToUint8Array(signDoc.bodyBytes)
  const authInfoBytes = AuthInfo.decode(signDoc.authInfoBytes)
  authInfoBytes.signerInfos[0].publicKey = {
    typeUrl: '/cosmos.crypto.secp256k1.PubKey',
    value: PubKey.encode({
      key: secp256k1.publicKeyConvert(
        Buffer.from(key.publicKey.slice(2), 'hex'),
        true
      ),
    }).finish(),
  }
  signDoc.authInfoBytes = AuthInfo.encode(authInfoBytes).finish()
  const bytes = makeSignBytes(signDoc)
  const hash = sha256(bytes)
  let resp = await key.signBlob({
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
  const signatureBytes = Secp256k1.trimRecoveryByte(
    Buffer.from(sig.slice(2), 'hex')
  )
  const stdSignature = encodeSecp256k1Signature(
    Secp256k1.compressPubkey(Buffer.from(key.publicKey.slice(2), 'hex')),
    signatureBytes
  )

  const tx = TxRaw.encode({
    bodyBytes: signDoc.bodyBytes,
    authInfoBytes: signDoc.authInfoBytes,
    signatures: [Buffer.from(stdSignature.signature, 'base64')],
  }).finish()

  return uint8ArrayToBase64(tx)
}

async function signCosmosAdr36Message(
  signer: string,
  userInfo: any,
  data: string,
  materialId: string,
  approveSession: any,
  paypin?: string
) {
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await oidcClient.org().getKey(`Key#Cosmos_${materialId}`)
  const signDoc = makeSignDoc(
    [
      {
        type: 'sign/MsgSignData',
        value: {
          signer: signer,
          data: data,
        },
      },
    ], // msg
    { gas: '0', amount: [] }, // no fee
    '', // no chain id
    '', // memo empty
    '0', // account number 0
    '0' // sequence 0
  )
  // sort json by key and convert to string
  const sortedSignDocJson = sortedJsonByKeyStringify(signDoc)
  const escapedSignDocString = escapeHTML(sortedSignDocJson)
  const serializedSignDoc = sha256(Buffer.from(escapedSignDocString))
  let resp = await key.signBlob({
    message_base64: Buffer.from(serializedSignDoc).toString('base64'),
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
  const signatureBytes = Secp256k1.trimRecoveryByte(
    Buffer.from(sig.slice(2), 'hex')
  )
  const stdSignature = encodeSecp256k1Signature(
    Secp256k1.compressPubkey(Buffer.from(key.publicKey.slice(2), 'hex')),
    signatureBytes
  )
  return stdSignature
}

export { signCosmosTransaction, signCosmosAdr36Message }
