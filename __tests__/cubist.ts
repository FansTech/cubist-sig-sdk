import {
  emailLogin,
  getOidcUserInfoSession,
  signEvmMessage,
  getSessionKeys,
  bindLoginPlatform,
  getOidcClient,
  getOidcResp,
  signEvmTransaction,
  proof,
  getCubistClient,
  signTronTypeDaya,
} from '../src/index'
import * as cs from '@cubist-labs/cubesigner-sdk'
import { CubeSignerClient, envs } from '@cubist-labs/cubesigner-sdk'

describe('cubist', () => {
  test('login', async () => {
    // const t = await emailLogin('13706207323@163.com', 'staging')
    // console.log(t)
    const token = `eyJhbGciOiJSUzI1NiIsImtpZCI6IjhlOGZjOGU1NTZmN2E3NmQwOGQzNTgyOWQ2ZjkwYWUyZTEyY2ZkMGQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0Nzk0NjU3NjEzMTEtNWRhNmIyaWM3aW83b2RyOWpucmxkYWkyMDA0NnZrNHQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0Nzk0NjU3NjEzMTEtNWRhNmIyaWM3aW83b2RyOWpucmxkYWkyMDA0NnZrNHQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDUyOTk2MjExMTY5NDA1Njk2MTgiLCJlbWFpbCI6InNoYWRvdzg4c2t5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJub25jZSI6InRlc3Rub25jZSIsIm5iZiI6MTc1MjEwNzU0MiwibmFtZSI6IuW-kOaZqCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NManhKMXJZeDFzVmlMYXdIdm40V3JYT3BhN2lxLTc5UGN4M2xadTBybHNVRGFTVlE9czk2LWMiLCJnaXZlbl9uYW1lIjoi5pmoIiwiZmFtaWx5X25hbWUiOiLlvpAiLCJpYXQiOjE3NTIxMDc4NDIsImV4cCI6MTc1MjExMTQ0MiwianRpIjoiM2YwOWI1Y2VjYTRiNzA5NDYxMWQ1ZDNmNGU4OGUzZTI2M2JiOTlhZCJ9.RsfdKxDlztP8YuUfw6NXRQWHJkrzAYFoagCpzf3tQLvnPMbraA2665c28nImx34lhEOOD6iLITgg6HzUL3uoZTVSpYCtV5QP3p8aJ_JcrifQmlx4uX9FzMBvIphKIsJYXZSZko38okUHlBF9yI-kWaHra9v3atI3MZ7JETny1QOI2UTj-IUO5dr4pknrlPz766udck5K2ZSVPGee7DegThPER0VZqV37m0_AYe97e6EZe0hfamKnwWsPGoYbBAfJw7C-XMzEvrzOAQ9RWSeja8mKD5AZr4YAVc5u-XG4eqQ_T56A1HrrvLHnBhVCZZwwccweLp-hbpD-5A-SYGqWgQ`
    const pro = await proof(token, 'staging')
    console.log(JSON.stringify(pro, null, 2))
    const resp = await getOidcResp(token, 'staging', 100000)
    console.log(resp)
    const client = await getCubistClient(resp.data())
    console.log(client)
    const api = client.apiClient
    const user = await api.userGet()
    console.log(JSON.stringify(user, null, 2))
    const identity = await api.identityList()
    console.log(JSON.stringify(identity, null, 2))
  }, 500000)
})
