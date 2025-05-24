import path from 'node:path'
import process from 'node:process'

// Declaração global para o Bun no topo do arquivo
declare global {
  interface BunSpawnOptions {
    cmd: string[]
    stdout?: 'inherit' | 'pipe'
    stderr?: 'inherit' | 'pipe'
    onExit?: (proc: any, exitCode: any) => void
  }

  const Bun: {
    env: Record<string, string | undefined>
    file: (path: string) => { text: () => Promise<string> }
    spawn: (options: BunSpawnOptions) => any
  }
}

// Caminho para o arquivo .env na raiz do projeto
const rootPath = path.resolve(__dirname, '../')
const envPath = path.join(rootPath, '.env')

// Verificar se encontrou o arquivo .env
try {
  console.log('Procurando .env em:', envPath)
  const envContent: any = Bun.file(envPath).text()

  // Logs para ajudar no diagnóstico
  envContent.then((content: any) => {
    console.log('Arquivo .env encontrado, conteúdo parcial:', `${content.substring(0, 50)}...`)

    // Vamos também mostrar todas as variáveis de ambiente disponíveis para verificação
    console.log('NUXT_PUBLIC_DIRECTUS_URL:', Bun.env.NUXT_PUBLIC_DIRECTUS_URL || '(não definido)')
    console.log('DIRECTUS_TOKEN:', Bun.env.DIRECTUS_TOKEN ? '(definido)' : '(não definido)')

    const DIRECTUS_HOST = Bun.env.NUXT_PUBLIC_DIRECTUS_URL
    const ADMIN_TOKEN = Bun.env.DIRECTUS_TOKEN
    const outputFile = path.resolve(rootPath, 'app/types/schema.ts')

    console.log('Gerando types do Directus...')

    if (!DIRECTUS_HOST) {
      console.error('Erro: NUXT_PUBLIC_DIRECTUS_URL não definido no arquivo .env')
      process.exit(1)
    }

    if (!ADMIN_TOKEN) {
      console.error('Erro: DIRECTUS_TOKEN não definido no arquivo .env')
      process.exit(1)
    }

    const _bunProcess: any = Bun.spawn({
      cmd: [
        'bunx',
        'directus-typeforge',
        '--host',
        DIRECTUS_HOST,
        '--token',
        ADMIN_TOKEN,
        '--outFile',
        outputFile,
      ],
      stdout: 'inherit',
      stderr: 'inherit',
      onExit(_proc: any, exitCode: any) {
        if (exitCode === 0) {
          console.log('Types gerados com sucesso em:', outputFile)
        }
        else {
          console.error('Erro ao gerar os types. Código de saída:', exitCode)
          process.exit(exitCode)
        }
      },
    })
  }).catch((error: any) => {
    console.error('Erro ao ler o conteúdo do arquivo .env:', error)
    process.exit(1)
  })
}
catch (error: any) {
  console.error('Erro ao carregar o arquivo .env:', error)
  process.exit(1)
}
