import * as path from 'node:path'

import prompts from 'prompts'
import fs from 'fs-extra'
import chalk from 'chalk'

async function main() {
  const { name, url } = await prompts([
    {
      name: 'name',
      type: 'text',
      message: '请输入站点名称',
      onState: (state) => String(state.value).trim(),
    },
    {
      name: 'url',
      type: 'text',
      message: '请输入站点 url（输入主域名即可）',
      onState: (state) => String(state.value).trim(),
      validate: (value) => value.includes('.') || '站点 url 格式不正确',
    },
  ])

  if (!url) {
    process.exit(0)
  }

  const filepath = path.join(process.cwd(), 'src', 'sites', `${url}.ts`)

  if (fs.existsSync(filepath)) {
    console.log(chalk.yellow(`站点【${name}】已经存在，请重新输入`))
    return main()
  }

  fs.outputFileSync(
    filepath,
    `import { pathname } from 'src/utils'

/******************************************************************************
 ** ${name}
 **   -
 ******************************************************************************/
const sites: SiteModule = [
  [
    '${name}',
    '${url}',
    {
      transform: {
        selector: ''
      },
    },
  ],
]

export default sites
`,
  )

  console.log(
    chalk.green(`站点【${name}】创建成功咯！
快打开 ./packages/remove-redirect/src/sites/${url}.ts 写代码吧!`),
  )
}

main()
