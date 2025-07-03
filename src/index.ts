import {
  CubeSignerClient,
  envs,
  MfaVote,
  Scope,
} from '@cubist-labs/cubesigner-sdk'
import { op } from '@cubist-labs/cubesigner-sdk/dist/cjs/src/fetch'
import * as cs from '@cubist-labs/cubesigner-sdk'
import { getTonWebProvider } from './ton'
import TonWeb from 'tonweb'
import secp256k1 from 'secp256k1'
const bitcoin = require('bitcoinjs-lib')

async function getTonAddress(publicKey: string) {
  const tonWeb = await getTonWebProvider()
  const WalletClass = tonWeb.wallet.all['v4R2']
  const wallet = new WalletClass(tonWeb.provider, {
    publicKey: tonWeb.utils.hexToBytes(publicKey),
    wc: 0,
  })
  const addressObj = new TonWeb.utils.Address(await wallet.getAddress())
  const address = addressObj.toString(true, true, false)
  addressObj.isTestOnly = true
  const testnetAddress = addressObj.toString(true, true, false)
  return { address, testnetAddress }
}

export async function emailLogin(email: string, env: 'production' | 'staging') {
  const { partial_token } = await CubeSignerClient.initEmailOtpAuth(
    env === 'staging' ? envs.gamma : envs.prod, // or envs.prod
    env === 'staging'
      ? 'Org#3d07a75a-1188-4bd0-acfa-671a198b83eb'
      : 'Org#71c13f6d-b992-4660-874d-2ae0fadc789f',
    email
  )
  return partial_token
}

/**
 * Creates an OIDC user info session
 * @param oidcToken - OIDC identity token for authentication
 * @param env - Environment type, 'production' for prod environment, 'staging' for staging environment
 * @param expire - Session expiration time in seconds
 * @returns Promise<void> - Async operation that creates an OIDC session
 */
export async function getOidcUserInfoSession(
  oidcToken: string,
  env: 'production' | 'staging',
  expire: number
) {
  const oidcSessionResp = await CubeSignerClient.createOidcSession(
    env === 'staging' ? envs.gamma : envs.prod,
    env === 'staging'
      ? 'Org#3d07a75a-1188-4bd0-acfa-671a198b83eb'
      : 'Org#71c13f6d-b992-4660-874d-2ae0fadc789f',
    oidcToken,
    [
      'sign:*',
      'export:*',
      'manage:mfa:*',
      'manage:key:readonly',
      'manage:identity:*',
      'manage:export:*',
    ],
    {
      session_lifetime: expire,
      auth_lifetime: expire,
      refresh_lifetime: expire,
    }
  )
  return oidcSessionResp.data()
}

export async function getOidcResp(
  oidcToken: string,
  env: 'production' | 'staging',
  expire: number,
  scope?: Array<Scope>
) {
  const oidcSessionResp = await CubeSignerClient.createOidcSession(
    env === 'staging' ? envs.gamma : envs.prod,
    env === 'staging'
      ? 'Org#3d07a75a-1188-4bd0-acfa-671a198b83eb'
      : 'Org#71c13f6d-b992-4660-874d-2ae0fadc789f',
    oidcToken,
    scope && scope?.length > 0
      ? scope!
      : [
          'sign:*',
          'export:*',
          'manage:mfa:*',
          'manage:identity:*',
          'manage:key:readonly',
          'manage:export:*',
        ],
    {
      session_lifetime: expire,
      auth_lifetime: expire,
      refresh_lifetime: expire,
    }
  )
  return oidcSessionResp
}

export async function getOidcClient(
  oidcToken: string,
  env: 'production' | 'staging',
  expire: number,
  scope?: Array<Scope>
) {
  const loginResp = await cs.CubeSignerClient.createOidcSession(
    env === 'staging' ? envs.gamma : envs.prod,
    env === 'staging'
      ? 'Org#3d07a75a-1188-4bd0-acfa-671a198b83eb'
      : 'Org#71c13f6d-b992-4660-874d-2ae0fadc789f',
    oidcToken,
    scope && scope?.length > 0
      ? scope!
      : [
          'sign:*',
          'export:*',
          'manage:mfa:*',
          'manage:key:readonly',
          'manage:identity:*',
          'manage:export:*',
        ],
    {
      session_lifetime: expire,
      auth_lifetime: expire,
      refresh_lifetime: expire,
    }
  )
  const oidcClient = loginResp.requiresMfa()
    ? await loginResp.mfaClient()
    : await cs.CubeSignerClient.create(loginResp.data())
  return oidcClient
}

export async function getApproveResp(
  oidcToken: string,
  env: 'production' | 'staging',
  expire: number
) {
  const loginResp = await cs.CubeSignerClient.createOidcSession(
    env === 'staging' ? envs.gamma : envs.prod,
    env === 'staging'
      ? 'Org#3d07a75a-1188-4bd0-acfa-671a198b83eb'
      : 'Org#71c13f6d-b992-4660-874d-2ae0fadc789f',
    oidcToken,
    ['manage:mfa:vote:cs'],
    {
      session_lifetime: expire,
      auth_lifetime: expire,
      refresh_lifetime: expire,
    }
  )
  return loginResp
}

export async function getCubistClient(userInfo: any) {
  return await cs.CubeSignerClient.create(userInfo)
}

export async function bindLoginPlatform(userInfo: any, oidcToken: string) {
  const client = await CubeSignerClient.create(userInfo)
  const apiClient = client.apiClient
  return await apiClient.identityAdd({ oidc_token: oidcToken })
}

export async function getSessionKeys(userInfo: any) {
  const oidcClient = await cs.CubeSignerClient.create(userInfo)
  const sessionKeys = await oidcClient.sessionKeys()
  const result: any = []
  for (const item of sessionKeys) {
    switch (true) {
      case item.cached.key_type === cs.Secp256k1.BtcLegacy &&
        item.cached.derivation_info?.derivation_path === "m/44'/0'/0'/0/0":
        result.push({
          type: 'p2pkh',
          address: item.materialId,
          publicKey: Buffer.from(
            secp256k1.publicKeyConvert(
              Buffer.from(item.publicKey.slice(2), 'hex'),
              true
            )
          ).toString('hex'),
        })
        break
      case item.cached.key_type === cs.Secp256k1.BtcLegacyTest &&
        item.cached.derivation_info?.derivation_path === "m/44'/0'/0'/0/0":
        result.push({
          type: 'p2pkh_test',
          address: item.materialId,
          publicKey: Buffer.from(
            secp256k1.publicKeyConvert(
              Buffer.from(item.publicKey.slice(2), 'hex'),
              true
            )
          ).toString('hex'),
        })
        break
      case item.cached.key_type === cs.Secp256k1.Btc &&
        item.cached.derivation_info?.derivation_path === "m/84'/0'/0'/0/0":
        result.push({
          type: 'p2wpkh',
          address: item.materialId,
          publicKey: Buffer.from(
            secp256k1.publicKeyConvert(
              Buffer.from(item.publicKey.slice(2), 'hex'),
              true
            )
          ).toString('hex'),
        })
        break
      case item.cached.key_type === cs.Secp256k1.BtcTest &&
        item.cached.derivation_info?.derivation_path === "m/84'/0'/0'/0/0":
        result.push({
          type: 'p2wpkh_test',
          address: item.materialId,
          publicKey: Buffer.from(
            secp256k1.publicKeyConvert(
              Buffer.from(item.publicKey.slice(2), 'hex'),
              true
            )
          ).toString('hex'),
        })
        break
      case item.cached.key_type === cs.Secp256k1.Taproot &&
        item.cached.derivation_info?.derivation_path === "m/86'/0'/0'/0/0":
        result.push({
          type: 'p2tr',
          address: item.materialId,
          publicKey: item.publicKey.replace('0x', '02'),
        })
        break
      case item.cached.key_type === cs.Secp256k1.TaprootTest &&
        item.cached.derivation_info?.derivation_path === "m/86'/0'/0'/0/0":
        result.push({
          type: 'p2tr_test',
          address: item.materialId,
          publicKey: item.publicKey.replace('0x', '02'),
        })
        break
      case item.cached.key_type === cs.Secp256k1.Btc &&
        item.cached.derivation_info?.derivation_path === "m/49'/0'/0'/0/0":
        let mainnet = bitcoin.networks.bitcoin
        let p2wpkhAddress = bitcoin.payments.p2wpkh({
          address: item.materialId,
        })
        let p2shAddress = bitcoin.payments.p2sh({
          redeem: p2wpkhAddress,
          network: mainnet,
        })
        result.push({
          type: 'p2sh',
          address: p2shAddress.address,
          materialId: item.materialId,
          publicKey: Buffer.from(
            secp256k1.publicKeyConvert(
              Buffer.from(item.publicKey.slice(2), 'hex'),
              true
            )
          ).toString('hex'),
        })
        break
      case item.cached.key_type === cs.Secp256k1.BtcTest &&
        item.cached.derivation_info?.derivation_path === "m/49'/0'/0'/0/0":
        const testnet = bitcoin.networks.testnet
        const p2wpkhAddressTest = bitcoin.payments.p2wpkh({
          address: item.materialId,
          network: testnet,
        })
        const p2shAddressTest = bitcoin.payments.p2sh({
          redeem: p2wpkhAddressTest,
          network: testnet,
        })
        result.push({
          type: 'p2sh_test',
          materialId: item.materialId,
          address: p2shAddressTest.address,
          publicKey: Buffer.from(
            secp256k1.publicKeyConvert(
              Buffer.from(item.publicKey.slice(2), 'hex'),
              true
            )
          ).toString('hex'),
        })
        break
      case item.cached.key_type === cs.Secp256k1.Cosmos &&
        item.cached.derivation_info?.derivation_path === "m/44'/118'/0'/0/0":
        result.push({
          type: 'cosmos',
          address: item.materialId,
        })
        result.push({
          type: 'babylon',
          address: item.materialId.replace('cosmos', 'bbn'),
        })
        break
      case item.cached.key_type === cs.Secp256k1.Doge &&
        item.cached.derivation_info?.derivation_path === "m/44'/3'/0'/0/0":
        result.push({
          type: 'doge',
          address: item.materialId,
        })
        break
      case item.cached.key_type === cs.Secp256k1.Evm &&
        item.cached.derivation_info?.derivation_path === "m/44'/60'/0'/0/0":
        result.push({
          type: 'evm',
          address: item.materialId,
        })
        break
      case item.cached.key_type === cs.Ed25519.Solana &&
        item.cached.derivation_info?.derivation_path === "m/44'/501'/0'/0'":
        result.push({
          type: 'solana',
          address: item.materialId,
        })
        break
      case item.cached.key_type === cs.Ed25519.Sui &&
        item.cached.derivation_info?.derivation_path === "m/44'/784'/0'/0'/0'":
        result.push({
          type: 'sui',
          address: item.materialId,
        })
        break
      case item.cached.key_type === cs.Ed25519.Ton &&
        item.cached.derivation_info?.derivation_path === "m/44'/607'/0":
        const { address, testnetAddress } = await getTonAddress(item.materialId)
        result.push({
          type: 'ton',
          address: address,
          publicKey: item.materialId,
        })
        result.push({
          type: 'ton_test',
          address: testnetAddress,
          publicKey: item.materialId,
        })
        break
      case item.cached.key_type === cs.Secp256k1.Tron &&
        item.cached.derivation_info?.derivation_path === "m/44'/195'/0'/0/0":
        result.push({
          type: 'tron',
          address: item.materialId,
        })
        break
      case item.cached.key_type === cs.Ed25519.Aptos &&
        item.cached.derivation_info?.derivation_path === "m/44'/637'/0'/0'/1":
        result.push({
          type: 'movement',
          address: item.materialId,
        })
        break
      default:
        console.log(
          `No match for ${item.cached.key_type} with path ${item.cached.derivation_info?.derivation_path}`
        )
    }
  }
  let userId = ''
  let mnemonicId = ''
  if (sessionKeys?.length > 0) {
    userId = sessionKeys[0].cached.owner
    mnemonicId = sessionKeys[0].cached.derivation_info?.mnemonic_id!
  }
  return {
    userId: userId,
    mnemonicId: mnemonicId,
    keys: result,
  }
}

export async function proof(id_token: string, env: 'production' | 'staging') {
  const env_bag = env === 'staging' ? envs.gamma : envs.prod
  const orgId =
    env === 'staging'
      ? 'Org#3d07a75a-1188-4bd0-acfa-671a198b83eb'
      : 'Org#71c13f6d-b992-4660-874d-2ae0fadc789f'
  return await CubeSignerClient.proveOidcIdentity(env_bag, orgId, id_token)
}

export async function opEmailOtp(
  userInfo: any,
  mfaId: string,
  mfaVote: MfaVote
) {
  const o = op('/v0/org/{org_id}/mfa/{mfa_id}/email' as any, 'post')
  const client = await getCubistClient(userInfo)
  const challenge = await client.apiClient.exec(o, {
    params: { path: { mfa_id: mfaId }, query: { mfa_vote: mfaVote } },
  })
  return challenge
}

export * from './bitcoin'
export * from './cosmos'
export * from './doge'
export * from './ethereum'
export * from './move'
export * from './solana'
export * from './sui'
export * from './ton'
export * from './tron'
