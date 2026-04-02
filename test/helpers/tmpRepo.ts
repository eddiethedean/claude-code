import { mkdtemp, writeFile } from 'fs/promises'
import os from 'os'
import path from 'path'
import { execa } from 'execa'

export type TmpRepo = {
  dir: string
  git: (args: string[]) => Promise<{ stdout: string; stderr: string }>
  write: (rel: string, content: string) => Promise<void>
  commitAll: (message: string) => Promise<void>
}

export async function createTmpRepo(): Promise<TmpRepo> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'claude-code-test-repo-'))

  const git = async (args: string[]) => {
    const res = await execa('git', args, { cwd: dir })
    return { stdout: res.stdout, stderr: res.stderr }
  }

  await git(['init'])
  await git(['config', 'user.email', 'test@example.com'])
  await git(['config', 'user.name', 'Test User'])

  const write = async (rel: string, content: string) => {
    const p = path.join(dir, rel)
    await writeFile(p, content, 'utf8')
  }

  const commitAll = async (message: string) => {
    await git(['add', '-A'])
    await git(['commit', '-m', message])
  }

  return { dir, git, write, commitAll }
}

