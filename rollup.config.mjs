import typescript from 'rollup-plugin-typescript2'
import dev from 'rollup-plugin-dev'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isProd = process.env.NODE_ENV === 'production'
const srcPath = path.join(__dirname, 'src')
const buildPath = path.join(__dirname, 'build')
const publicPath = path.join(__dirname, 'public')

const config = {
  input: path.join(srcPath, 'FixedPointScaling.ts'),
  output: [
    {
      format: 'iife',
      name: 'FixedPointScaling',
      file: path.join(isProd ? buildPath : publicPath, 'index.iife.js'),
    },
    isProd && {
      format: 'umd',
      name: 'FixedPointScaling',
      file: path.join(buildPath, 'index.umd.js'),
    },
    isProd && {
      format: 'cjs',
      file: path.join(buildPath, 'index.js'),
    },
    isProd && {
      format: 'es',
      file: path.join(buildPath, 'index.es.js'),
    },
  ].filter(Boolean),
  plugins: [
    !isProd &&
      dev({
        dirs: [publicPath],
        port: 3457,
      }),
    typescript(),
  ].filter(Boolean),
}

export default config
