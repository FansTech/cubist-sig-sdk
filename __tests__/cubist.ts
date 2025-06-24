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
} from '../src/index'
import * as cs from '@cubist-labs/cubesigner-sdk'
import { CubeSignerClient, envs } from '@cubist-labs/cubesigner-sdk'

describe('cubist', () => {
  // test('emailLogin', async () => {
  //   //   // let result = await proof(
  //   //   //   'eyJhbGciOiJSUzI1NiIsImtpZCI6ImJiNDM0Njk1OTQ0NTE4MjAxNDhiMzM5YzU4OGFlZGUzMDUxMDM5MTkiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0Nzk0NjU3NjEzMTEtNWRhNmIyaWM3aW83b2RyOWpucmxkYWkyMDA0NnZrNHQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0Nzk0NjU3NjEzMTEtNWRhNmIyaWM3aW83b2RyOWpucmxkYWkyMDA0NnZrNHQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDUyOTk2MjExMTY5NDA1Njk2MTgiLCJlbWFpbCI6InNoYWRvdzg4c2t5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJub25jZSI6InRlc3Rub25jZSIsIm5iZiI6MTc0OTE3MDA5NSwibmFtZSI6IuW-kOaZqCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NManhKMXJZeDFzVmlMYXdIdm40V3JYT3BhN2lxLTc5UGN4M2xadTBybHNVRGFTVlE9czk2LWMiLCJnaXZlbl9uYW1lIjoi5pmoIiwiZmFtaWx5X25hbWUiOiLlvpAiLCJpYXQiOjE3NDkxNzAzOTUsImV4cCI6MTc0OTE3Mzk5NSwianRpIjoiMTY2M2QwOTYxYzk4NjZjMDY5YTcxMjk0N2JjZjQzNDM2OWNkYmRiZSJ9.rKJdXn0BEU5zT0rWIfJe3sBDFKxaXt90OHu0NxncJ6yYzjoCXIDWjx6h7QS_NimtVsjdK-HFA2fT_gF_e0qJwLEtvPAdP7P8HqPsP927tm-kag9vlQWjWI5FwwGxXXmIgMmJpxo0ndwltW99Csx7YJbB3iUz6iSzqj7eodWzGcgr_bB86Tx9XW7Nv-pGFZTAb4l52Q0pqFnjFtcxfLxAPGReHdY-Uuz-kWWGehf8ytzvWVl0D0aWdSpYhZxEBEH7wNcoGjNE7E9MKGB2nc0bZ68Kpjey9Iji_aJcDF6FKuCvzPFWLjN_U_b_NZfdjA3xLkTepAKhxFEF8oc9xm9y2A',
  //   //   //   'staging'
  //   //   // )
  //   //   // const token =
  //   //   //   'eyJhbGciOiJSUzI1NiIsImtpZCI6ImJiNDM0Njk1OTQ0NTE4MjAxNDhiMzM5YzU4OGFlZGUzMDUxMDM5MTkiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0Nzk0NjU3NjEzMTEtNWRhNmIyaWM3aW83b2RyOWpucmxkYWkyMDA0NnZrNHQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0Nzk0NjU3NjEzMTEtNWRhNmIyaWM3aW83b2RyOWpucmxkYWkyMDA0NnZrNHQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDUyOTk2MjExMTY5NDA1Njk2MTgiLCJlbWFpbCI6InNoYWRvdzg4c2t5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJub25jZSI6InRlc3Rub25jZSIsIm5iZiI6MTc0OTE3NDk1NywibmFtZSI6IuW-kOaZqCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NManhKMXJZeDFzVmlMYXdIdm40V3JYT3BhN2lxLTc5UGN4M2xadTBybHNVRGFTVlE9czk2LWMiLCJnaXZlbl9uYW1lIjoi5pmoIiwiZmFtaWx5X25hbWUiOiLlvpAiLCJpYXQiOjE3NDkxNzUyNTcsImV4cCI6MTc0OTE3ODg1NywianRpIjoiYTIxMmMxZDAyNDIwMjI4NDZhNTYwMzIyODE4Y2NjNDA5MDhkY2M4MCJ9.Ia1yjgSPX8wetIMubuDB0EtfZbhzsCVdiG6Q8cagzb4kInAhmIwlrxDiaWoyG_cKDl-drgokWgtr1byc5NfXFn_wtS31Le16gZe5tw4WgeqP4Bya40DHCi4PsLJQ6TsWzEN61cI92GEHyTNrUZS9xsL-LfafhkbfN1In3BBiVOCSWvrYOiTFkXTjqy8OAAtbli6t4n9Yt0YZXmOrfXgggHHj5e10LaJELSIanWKmMuDIAVx5PZBONEfNkn2TdbWaB-wZ-c7AIZGeJepu167MnanT6mLdZZRn_aZVbxxTedLmWbTw54TM2zH81lukKkpYSWu6nXW7hSsssHyFl7Rfow'
  //   //   // const token = await emailLogin('shadow88sky@gmail.com', 'staging')
  //   const token = await proof(
  //     'eyJhbGciOiJSUzI1NiIsImtpZCI6IjBkOGE2NzM5OWU3ODgyYWNhZTdkN2Y2OGIyMjgwMjU2YTc5NmE1ODIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0Nzk0NjU3NjEzMTEtNWRhNmIyaWM3aW83b2RyOWpucmxkYWkyMDA0NnZrNHQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0Nzk0NjU3NjEzMTEtNWRhNmIyaWM3aW83b2RyOWpucmxkYWkyMDA0NnZrNHQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDUyOTk2MjExMTY5NDA1Njk2MTgiLCJlbWFpbCI6InNoYWRvdzg4c2t5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJub25jZSI6InRlc3Rub25jZSIsIm5iZiI6MTc0OTYzNTM0MywibmFtZSI6IuW-kOaZqCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NManhKMXJZeDFzVmlMYXdIdm40V3JYT3BhN2lxLTc5UGN4M2xadTBybHNVRGFTVlE9czk2LWMiLCJnaXZlbl9uYW1lIjoi5pmoIiwiZmFtaWx5X25hbWUiOiLlvpAiLCJpYXQiOjE3NDk2MzU2NDMsImV4cCI6MTc0OTYzOTI0MywianRpIjoiNjVlZDliZTUxOGI4N2QxNGUwODIxOTViNjRmYTc3NjM2ZmUxN2ZkMiJ9.KFYMgYWpCleL9qDhtCR1gWO29IZR3aLOSCGeYl_gMoZ9HH3cfti70o9YPlwHgQFcOhJsEyTZw7UCLyMO6Lc1LUG1GzruFpmNqjJuQbTrZ2ENpLa1Q-67m31L55SkaAUV12VwbuXLYgXay_yMtprRUtgQJYzO4pq7e31VlYt3jdYUomdb1rX8b15rzqo3jiHrEmbhqvio4iEMUg4ehqcqXosgELztS1LeJcIER9t8E8tkllCBxvIYVCXwG3TBiQ9NQx2NixBdq9pMr_rsDqTzcPh0QTljb6OZ-4WV4tqFwEbAVRSJ3cum2OxYcGOC56NL6pUOxTukxEs9W1BZFACgUw',
  //     'staging'
  //   )
  //   console.log(JSON.stringify(token, null, 2))
  //   // const resp = await getOidcResp(
  //   //   'eyJhbGciOiJSUzI1NiIsImtpZCI6IjBkOGE2NzM5OWU3ODgyYWNhZTdkN2Y2OGIyMjgwMjU2YTc5NmE1ODIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0Nzk0NjU3NjEzMTEtNWRhNmIyaWM3aW83b2RyOWpucmxkYWkyMDA0NnZrNHQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0Nzk0NjU3NjEzMTEtNWRhNmIyaWM3aW83b2RyOWpucmxkYWkyMDA0NnZrNHQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDUyOTk2MjExMTY5NDA1Njk2MTgiLCJlbWFpbCI6InNoYWRvdzg4c2t5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJub25jZSI6InRlc3Rub25jZSIsIm5iZiI6MTc0OTYzNTM0MywibmFtZSI6IuW-kOaZqCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NManhKMXJZeDFzVmlMYXdIdm40V3JYT3BhN2lxLTc5UGN4M2xadTBybHNVRGFTVlE9czk2LWMiLCJnaXZlbl9uYW1lIjoi5pmoIiwiZmFtaWx5X25hbWUiOiLlvpAiLCJpYXQiOjE3NDk2MzU2NDMsImV4cCI6MTc0OTYzOTI0MywianRpIjoiNjVlZDliZTUxOGI4N2QxNGUwODIxOTViNjRmYTc3NjM2ZmUxN2ZkMiJ9.KFYMgYWpCleL9qDhtCR1gWO29IZR3aLOSCGeYl_gMoZ9HH3cfti70o9YPlwHgQFcOhJsEyTZw7UCLyMO6Lc1LUG1GzruFpmNqjJuQbTrZ2ENpLa1Q-67m31L55SkaAUV12VwbuXLYgXay_yMtprRUtgQJYzO4pq7e31VlYt3jdYUomdb1rX8b15rzqo3jiHrEmbhqvio4iEMUg4ehqcqXosgELztS1LeJcIER9t8E8tkllCBxvIYVCXwG3TBiQ9NQx2NixBdq9pMr_rsDqTzcPh0QTljb6OZ-4WV4tqFwEbAVRSJ3cum2OxYcGOC56NL6pUOxTukxEs9W1BZFACgUw',
  //   //   'staging',
  //   //   10000
  //   // )
  //   // console.log(resp.requiresMfa())
  //   // const cliet = await getOidcClient(
  //   //   'eyJhbGciOiJSUzI1NiIsImtpZCI6IjBkOGE2NzM5OWU3ODgyYWNhZTdkN2Y2OGIyMjgwMjU2YTc5NmE1ODIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0Nzk0NjU3NjEzMTEtNWRhNmIyaWM3aW83b2RyOWpucmxkYWkyMDA0NnZrNHQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0Nzk0NjU3NjEzMTEtNWRhNmIyaWM3aW83b2RyOWpucmxkYWkyMDA0NnZrNHQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDUyOTk2MjExMTY5NDA1Njk2MTgiLCJlbWFpbCI6InNoYWRvdzg4c2t5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJub25jZSI6InRlc3Rub25jZSIsIm5iZiI6MTc0OTYzNTM0MywibmFtZSI6IuW-kOaZqCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NManhKMXJZeDFzVmlMYXdIdm40V3JYT3BhN2lxLTc5UGN4M2xadTBybHNVRGFTVlE9czk2LWMiLCJnaXZlbl9uYW1lIjoi5pmoIiwiZmFtaWx5X25hbWUiOiLlvpAiLCJpYXQiOjE3NDk2MzU2NDMsImV4cCI6MTc0OTYzOTI0MywianRpIjoiNjVlZDliZTUxOGI4N2QxNGUwODIxOTViNjRmYTc3NjM2ZmUxN2ZkMiJ9.KFYMgYWpCleL9qDhtCR1gWO29IZR3aLOSCGeYl_gMoZ9HH3cfti70o9YPlwHgQFcOhJsEyTZw7UCLyMO6Lc1LUG1GzruFpmNqjJuQbTrZ2ENpLa1Q-67m31L55SkaAUV12VwbuXLYgXay_yMtprRUtgQJYzO4pq7e31VlYt3jdYUomdb1rX8b15rzqo3jiHrEmbhqvio4iEMUg4ehqcqXosgELztS1LeJcIER9t8E8tkllCBxvIYVCXwG3TBiQ9NQx2NixBdq9pMr_rsDqTzcPh0QTljb6OZ-4WV4tqFwEbAVRSJ3cum2OxYcGOC56NL6pUOxTukxEs9W1BZFACgUw',
  //   //   'staging',
  //   //   10000
  //   // )
  //   // const newToken =
  //   //   'eyJhbGciOiJSUzI1NiIsImtpZCI6IjBkOGE2NzM5OWU3ODgyYWNhZTdkN2Y2OGIyMjgwMjU2YTc5NmE1ODIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0Nzk0NjU3NjEzMTEtcW51dGVoZXQxOHRlcjBjaWtvYmp0dWMyb2pvYjE4ZXAuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0Nzk0NjU3NjEzMTEtcW51dGVoZXQxOHRlcjBjaWtvYmp0dWMyb2pvYjE4ZXAuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTQzMzEzOTUwMjU3MTc2ODgzMjkiLCJlbWFpbCI6InFpcWlydTg4OEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6IkNLZ1dMb1pFaERrc2dVVVNJaC1Yb1EiLCJub25jZSI6IkN5blV0R0tuV3F4Y0hZdm5sa2RGZ042VEhYUUU4bUlLUVFWQWFzc2gxdzQiLCJuYW1lIjoicWlxaSBydSIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJSzhmVjRacGgzQ0dJQjlxYW1TM1ZBdkZ1U2xUTDBXQThJdUoxcHFzSmttNGZjazcwPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6InFpcWkiLCJmYW1pbHlfbmFtZSI6InJ1IiwiaWF0IjoxNzQ5NTM5Nzk2LCJleHAiOjE3NDk1NDMzOTZ9.hzW24zp96PA2TSNMX6VRkHVwxlGT330sAFbiNGR5gKT4cfYu-dirxbgSN1T7DqgDhjHX3rC0U4247aeiDAXfBJBvm1EYFJUecJW8nrU-6NWyRnqDMX8agImTdiv5QQzgAo0VP_MwHByid7oSYAGmqJT4clrYUNmvZq7r4mezK_5kFZ7IcQRmIYFpmY2fezTJj1bpwYbUi2QI3UH4c49WeUGqknMwqycQw-YJsPZR3UDxR_Lv32zxYfiKEXTxF3DBf33DLwYMvzpIM2rZVgn6AKC_S4KKfhRSzjki8iiJk7p4MbMsp0dN23tOaGZwWHwVbyqhIj8q2KImpzt2qPHllQ'
  //   // const pro = await proof(newToken, 'staging')
  //   // console.log(JSON.stringify(pro, null, 2))
  //   // const resp = await CubeSignerClient.createOidcSession(
  //   //   envs.gamma,
  //   //   'Org#3d07a75a-1188-4bd0-acfa-671a198b83eb',
  //   //   newToken,
  //   //   ['manage:*', 'sign:*', 'export:*'],
  //   //   {
  //   //     session_lifetime: 10000,
  //   //     auth_lifetime: 10000,
  //   //     refresh_lifetime: 10000,
  //   //   }
  //   // )
  //   // console.log(resp.requiresMfa())
  //   // const client = await getApproveClient(resp.data())
  //   // const identity = await client.apiClient.identityList()
  //   // console.log(identity)
  //   // const keyId = `Key#Mnemonic_0xd9998218efda6cb2830248204d56dcd34f9b2a7802aa560f795f2d0bf3dfb523`
  //   // let mne_init_resp = await client.org().initExport(keyId)
  //   // if (mne_init_resp.requiresMfa()) {
  //   //   const mfaId = mne_init_resp.mfaId()
  //   //   const result = await client.apiClient.mfaVoteEmailInit(mfaId!, 'approve')
  //   // }
  //   //   // const newToken =
  //   //   //   'eyJhbGciOiJIUzUxMiJ9.eyJlbWFpbCI6IjEzNzA2MjA3MzIzQDE2My5jb20iLCJhdWQiOiJPcmcjM2QwN2E3NWEtMTE4OC00YmQwLWFjZmEtNjcxYTE5OGI4M2ViIiwiaXNzIjoiaHR0cHM6Ly9zaGltLm9hdXRoMi5jdWJpc3QuZGV2L2VtYWlsLW90cCIsInN1YiI6IjEzNzA2MjA3MzIzQDE2My5jb20iLCJub25jZSI6IldDd1RiR21LbUVOZWNVVVlOQjJVaWdNSGxoZTlYNFdnUUp5Y0lvVVpvSjAiLCJleHAiOjE3NDkzNDQ4MDQsImlhdCI6MTc0OTM0NDUwNCwiZW1haWxfdmVyaWZpZWQiOnRydWV9.9gznB9Hk9tzs05LaoGKLBZ0wXEN6ebPx2mawFhyLS3x7KgTbVnNhGoFgp-kTvzHLrRz0K2ljzNUADQwpHqv-Ug'
  //   //   // const result = await proof(newToken, 'staging')
  //   //   // console.log(JSON.stringify(result, null, 2))
  // }, 100000)

  // test('email test', async () => {
  //   const token =
  //     'eyJhbGciOiJIUzUxMiJ9.eyJwcmVmZXJyZWRfdXNlcm5hbWUiOiJpY2VLeWxpbjMyMTYiLCJhdWQiOiJWazEzV0RCUFRtZEpkVVJUUzI1WWNVTlVTREE2TVRwamFRIiwiaXNzIjoiaHR0cHM6Ly9zaGltLm9hdXRoMi5jdWJpc3QuZGV2L3R3aXR0ZXIiLCJzdWIiOiIxNzcyMTk3NTI2NDk5OTU4Nzg0Iiwibm9uY2UiOm51bGwsImV4cCI6MTc1MDU2OTU5NCwiaWF0IjoxNzUwNTYyMzk0fQ.Sme8X1brTcGCPOYKbT21Af0E2VbMqiI5FoSAQok2SptGsmK2XFJC48pa7fMzoXCe70txW1WRg2wFwy6QxorS5g'
  //   const identity = await proof(token, 'staging')
  //   console.log(JSON.stringify(identity, null, 2))
  //   const client = await getOidcClient(token, 'staging', 10000)

  //   let resp = await getOidcResp(token, 'staging', 10000)
  //   console.log(resp.requiresMfa())
  //   if (resp.requiresMfa()) {
  //     const mfaId = resp.mfaId()
  //     const result = await client!.apiClient.mfaVoteEmailInit(mfaId!, 'approve')
  //     console.log(result)
  //   }
  // }, 500000)

  test('paypin', async () => {
    const token =
      'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFiYjc3NGJkODcyOWVhMzhlOWMyZmUwYzY0ZDJjYTk0OGJmNjZmMGYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0Nzk0NjU3NjEzMTEtNWRhNmIyaWM3aW83b2RyOWpucmxkYWkyMDA0NnZrNHQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0Nzk0NjU3NjEzMTEtNWRhNmIyaWM3aW83b2RyOWpucmxkYWkyMDA0NnZrNHQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDUyOTk2MjExMTY5NDA1Njk2MTgiLCJlbWFpbCI6InNoYWRvdzg4c2t5QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJub25jZSI6InRlc3Rub25jZSIsIm5iZiI6MTc1MDY0NzU3NiwibmFtZSI6IuW-kOaZqCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NManhKMXJZeDFzVmlMYXdIdm40V3JYT3BhN2lxLTc5UGN4M2xadTBybHNVRGFTVlE9czk2LWMiLCJnaXZlbl9uYW1lIjoi5pmoIiwiZmFtaWx5X25hbWUiOiLlvpAiLCJpYXQiOjE3NTA2NDc4NzYsImV4cCI6MTc1MDY1MTQ3NiwianRpIjoiYWRkY2ZiYjdiYzZiMzdkMWZkYzFkM2IxMmIxZGUzZmNiNzA4YTAwYSJ9.xDybw2z-M6_wN_9v5Y0uH99Si9SrslUF9QQEtpY2tRC4XrOeWxcHjJSxO9TIl0SlsdMV2LQR5TL_OWgNIsrEOg9mJeD5lVJ2Ar6AVwjYrUG8GpRu2aq59SBrtK9lJ5dZ1FUwVeGplD7D5XHCq2RHaJ6la22xZ8oBKDsuPBfDXwQbBOnT_UWFP5aIdb33m_eG6009trXVdlj03ppeeJmZCEHd3XOu-t4cCKOxWmYJ6ZXNhiBkuv9qhUzDiaMdCtDI1mziuEXZf0OhYs8CEuxFDJkXjC2kuDYtq3iHZ1Z8wy0qjTGdjhstbbBApWDzxr1cVhe1Xww4qp7ydfysi13evQ'

    const client = await getCubistClient(resp.data())
    const apiClient = client.apiClient
    const userInfo = await apiClient.userGet
  }, 500000)
})
