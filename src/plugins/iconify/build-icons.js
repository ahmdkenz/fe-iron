import { promises as fs } from 'node:fs'
import { dirname, extname, join } from 'node:path'

import { cleanupSVG, importDirectory, isEmptyColor, parseColors, runSVGO } from '@iconify/tools'
import { getIcons, getIconsCSS } from '@iconify/utils'

const ICON_SET_FILES = {
  bxl: '@iconify-json/bxl/icons.json',
  mdi: '@iconify-json/mdi/icons.json',
  ri: '@iconify-json/ri/icons.json',
}

const ICON_NAME_PATTERN = /\b(?<prefix>ri|mdi|bxl)-[a-z0-9-]+\b/g
const SCANNED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.vue'])

// These icons are rendered from local SVG files in `src/plugins/vuetify/icons.js`.
const LOCAL_ICON_OVERRIDES = new Set([
  'mdi-checkbox-blank-outline',
  'mdi-checkbox-marked',
  'mdi-minus-box',
  'mdi-radiobox-blank',
  'mdi-radiobox-marked',
])

const sources = {
  svg: [
    // {
    //   dir: 'src/assets/images/iconify-svg',
    //   monotone: true,
    //   prefix: 'custom',
    // },
  ],
}

const projectRoot = join(__dirname, '..', '..', '..')
const scanTargets = [
  join(projectRoot, 'src'),
  join(projectRoot, 'themeConfig.js'),
]
const target = join(__dirname, 'icons.css')

;(async function buildIcons() {
  await fs.mkdir(dirname(target), { recursive: true })

  const allIcons = []
  const projectIconSources = await collectProjectIconSources()

  for (const item of projectIconSources) {
    const content = JSON.parse(await fs.readFile(item.filename, 'utf8'))
    const filteredContent = getIcons(content, item.icons)

    if (!filteredContent)
      throw new Error(`Cannot find required icons in ${item.filename}`)

    allIcons.push(filteredContent)
  }

  if (sources.svg.length) {
    for (const source of sources.svg) {
      const iconSet = await importDirectory(source.dir, {
        prefix: source.prefix,
      })

      await iconSet.forEach(async (name, type) => {
        if (type !== 'icon')
          return

        const svg = iconSet.toSVG(name)

        if (!svg) {
          iconSet.remove(name)

          return
        }

        try {
          await cleanupSVG(svg)

          if (source.monotone) {
            await parseColors(svg, {
              defaultColor: 'currentColor',
              callback: (attr, colorStr, color) => {
                return !color || isEmptyColor(color) ? colorStr : 'currentColor'
              },
            })
          }

          await runSVGO(svg)
        } catch (error) {
          console.error(`Error parsing ${name} from ${source.dir}:`, error)
          iconSet.remove(name)
          return
        }

        iconSet.fromSVG(name, svg)
      })

      allIcons.push(iconSet.export())
    }
  }

  const cssContent = allIcons
    .map(iconSet => getIconsCSS(iconSet, Object.keys(iconSet.icons), { iconSelector: '.{prefix}-{name}' }))
    .join('\n')

  await fs.writeFile(target, cssContent, 'utf8')

  const summary = projectIconSources
    .map(item => `${item.prefix}:${item.icons.length}`)
    .join(', ')

  console.log(`Saved CSS to ${target}${summary ? ` (${summary})` : ''}!`)
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})

async function collectProjectIconSources() {
  const iconsByPrefix = new Map(
    Object.keys(ICON_SET_FILES).map(prefix => [prefix, new Set()]),
  )

  for (const scanTarget of scanTargets)
    await walkFiles(scanTarget, async file => {
      if (!SCANNED_EXTENSIONS.has(extname(file)))
        return

      const content = await fs.readFile(file, 'utf8')

      for (const match of content.matchAll(ICON_NAME_PATTERN)) {
        const iconName = match[0]

        if (LOCAL_ICON_OVERRIDES.has(iconName))
          continue

        const prefix = match.groups?.prefix

        if (!prefix)
          continue

        iconsByPrefix.get(prefix)?.add(iconName.slice(prefix.length + 1))
      }
    })

  return Array.from(iconsByPrefix.entries())
    .map(([prefix, icons]) => ({
      prefix,
      filename: require.resolve(ICON_SET_FILES[prefix]),
      icons: Array.from(icons).sort(),
    }))
    .filter(item => item.icons.length > 0)
}

async function walkFiles(targetPath, visitor) {
  if (!await pathExists(targetPath))
    return

  const stats = await fs.stat(targetPath)

  if (stats.isFile()) {
    await visitor(targetPath)

    return
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name === 'dist' || entry.name === 'node_modules')
      continue

    await walkFiles(join(targetPath, entry.name), visitor)
  }
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}
