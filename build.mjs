import { promises as fs } from 'fs'

;(async () => {
  // 复制 CommonJS 版本
  await fs.copyFile('./dist/index.js', './dist/index.cjs.js')

  // 读取内容并改成 ESM 格式
  let content = await fs.readFile('./dist/index.js', 'utf8')
  content = content.replace(/module\.exports\s*=\s*/, 'export default ')

  // 写入 ESM 版本
  await fs.writeFile('./dist/index.esm.js', content)
})()
