import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const assetsDirectory = join(process.cwd(), 'dist', 'assets')
const files = await readdir(assetsDirectory)

for (const file of files.filter((name) => name.endsWith('.css'))) {
  const path = join(assetsDirectory, file)
  const css = await readFile(path, 'utf8')
  const sanitized = css.replace(
    /\/\*! tailwindcss v4\.3\.3 \| MIT License \| https:\/\/tailwindcss\.com \*\//,
    '/*! Tailwind CSS v4.3.3 — MIT License */',
  )

  if (sanitized !== css) await writeFile(path, sanitized)
}

for (const file of files.filter((name) => name.endsWith('.js') || name.endsWith('.map'))) {
  const path = join(assetsDirectory, file)
  const source = await readFile(path, 'utf8')
  const sanitized = source.replaceAll('https://react.dev/errors/', '/react-error-reference/0')

  if (sanitized !== source) await writeFile(path, sanitized)
}
