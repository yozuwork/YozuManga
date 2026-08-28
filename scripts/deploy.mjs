import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDirectory = path.join(projectRoot, 'dist')
const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'yozu-manga-pages-'))
const publishDirectory = path.join(temporaryRoot, 'site')

function run(command, args, cwd, captureOutput = false, allowFailure = false) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: captureOutput ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    shell: false,
  })

  if (result.status !== 0 && !allowFailure) {
    const detail = captureOutput ? result.stderr.trim() : ''
    throw new Error(`${command} ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`)
  }

  return captureOutput && result.status === 0 ? result.stdout.trim() : ''
}

try {
  const remoteUrl = run('git', ['remote', 'get-url', 'origin'], projectRoot, true)
  const userName = run('git', ['config', 'user.name'], projectRoot, true, true) || 'YozuManga Deploy'
  const userEmail = run('git', ['config', 'user.email'], projectRoot, true, true) || 'deploy@localhost'

  await cp(distDirectory, publishDirectory, { recursive: true })
  await writeFile(path.join(publishDirectory, '.nojekyll'), '')

  run('git', ['init'], publishDirectory)
  run('git', ['checkout', '-b', 'gh-pages'], publishDirectory)
  run('git', ['config', 'user.name', userName], publishDirectory)
  run('git', ['config', 'user.email', userEmail], publishDirectory)
  run('git', ['add', '--all'], publishDirectory)
  run('git', ['commit', '-m', 'deploy: publish site'], publishDirectory)
  run('git', ['push', '--force', remoteUrl, 'HEAD:gh-pages'], publishDirectory)

  process.stdout.write('\nGitHub Pages assets published to the gh-pages branch.\n')
} finally {
  await rm(temporaryRoot, { recursive: true, force: true })
}
