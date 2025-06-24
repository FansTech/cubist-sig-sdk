import { SuiClient } from '@mysten/sui/client'
import {
  type PublicKey,
  type SignatureScheme,
  Signer,
} from '@mysten/sui/cryptography'
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519'
import * as cs from '@cubist-labs/cubesigner-sdk'
import { Transaction } from '@mysten/sui/transactions'
import { IMetadata } from './common/type'
// const rl = require('readline-sync')

class CsSuiSigner extends Signer {
  readonly #csCLient: cs.CubeSignerClient
  readonly #key: cs.Key
  readonly #approveSession: any
  readonly #metadata?: string

  /**
   * Constructor
   * @param {cs.CubeSignerClient} csClient CubeSigner client
   * @param {KeyInfo} key The key to use for signing
   */
  constructor(
    csClient: cs.CubeSignerClient,
    key: cs.KeyInfo,
    approveSession: any,
    paypin?: string
  ) {
    super()
    this.#csCLient = csClient
    this.#key = new cs.Key(csClient, key)
    this.#approveSession = approveSession
    this.#metadata = paypin
  }

  /**
   * Sign raw bytes
   * @param {Uint8Array} bytes The bytes to sign
   * @return {Uint8Array} The signature
   */
  async sign(bytes: Uint8Array): Promise<Uint8Array> {
    let resp = await this.#key.signBlob({
      message_base64: Buffer.from(bytes).toString('base64'),
      metadata: this.#metadata,
    })
    if (resp.requiresMfa()) {
      const approveClient = await cs.CubeSignerClient.create(
        this.#approveSession
      )
      const approvedMfa = await approveClient
        .org()
        .getMfaRequest(resp.mfaId()!)
        .approve()
      const receipt = await approvedMfa.receipt()
      resp = await resp.execWithMfaApproval({
        ...receipt!,
      })
    }
    // // ask for the user to approve if needed
    // while (resp.requiresMfa()) {
    //   const mfaId = resp.mfaId()
    //   const mfaConf = rl.question(
    //     `Please approve ${mfaId} and enter the confirmation code:\n> `
    //   )
    //   resp = await resp.execWithMfaApproval({
    //     mfaConf,
    //     mfaId: mfaId!,
    //     mfaOrgId: this.#csCLient.orgId,
    //   })
    // }

    // return the signature
    const sig = resp.data().signature
    return new Uint8Array(Buffer.from(sig.slice(2), 'hex'))
  }

  /**
   * @return {SignatureScheme} The signature scheme
   */
  getKeyScheme(): SignatureScheme {
    return 'ED25519'
  }

  /**
   * @return {PublicKey} The Ed25519 public key of this signer's key.
   */
  getPublicKey(): PublicKey {
    const bytes = Buffer.from(this.#key.publicKey.slice(2), 'hex')
    return new Ed25519PublicKey(bytes)
  }
}
async function signSuiTransaction(
  transaction: string,
  userInfo: any,
  url = 'https://fullnode.mainnet.sui.io:443',
  materialId: string,
  approveSession: any,
  paypin?: string
) {
  const suiClient = new SuiClient({ url })
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await oidcClient.org().getKey(`Key#Sui_${materialId}`)
  const csSuiSigner = new CsSuiSigner(
    oidcClient,
    key.cached,
    approveSession,
    paypin
  )
  const tx = Transaction.from(transaction)
  const signatureWithBytes = await csSuiSigner.signTransaction(
    await tx.build({
      client: suiClient,
    })
  )
  return signatureWithBytes.signature
}

async function signSuiMessage(
  text: string,
  userInfo: any,
  materialId: string,
  approveSession: any,
  paypin?: string
): Promise<string> {
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const key = await oidcClient.org().getKey(`Key#Sui_${materialId}`)
  const csSuiSigner = new CsSuiSigner(
    oidcClient,
    key.cached,
    approveSession,
    paypin
  )
  const signatureWithBytes = await csSuiSigner.signPersonalMessage(
    Buffer.from(text)
  )
  return signatureWithBytes.signature
}

export { signSuiTransaction, signSuiMessage }
