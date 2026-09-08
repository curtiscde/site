import fs from 'node:fs'
import { getImageManifest, resetImageManifestCache } from './manifest'

jest.mock('node:fs', () => ({
  __esModule: true,
  default: { readFileSync: jest.fn() },
}))

const readFileSync = fs.readFileSync as jest.Mock

describe('getImageManifest', () => {
  beforeEach(() => {
    resetImageManifestCache()
    readFileSync.mockReset()
  })

  it('parses the manifest written by the generator', () => {
    readFileSync.mockReturnValue(JSON.stringify({ '/a.png': { width: 10 } }))

    expect(getImageManifest()).toEqual({ '/a.png': { width: 10 } })
  })

  it('returns an empty manifest when the file does not exist', () => {
    // `npm run dev` before a first `npm run images` is a normal state, not an error.
    readFileSync.mockImplementation(() => {
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })

    expect(getImageManifest()).toEqual({})
  })

  it('returns an empty manifest when the file is corrupt', () => {
    readFileSync.mockReturnValue('{ not json')

    expect(getImageManifest()).toEqual({})
  })

  it('reads from disk once and caches thereafter', () => {
    readFileSync.mockReturnValue('{}')

    getImageManifest()
    getImageManifest()
    getImageManifest()

    expect(readFileSync).toHaveBeenCalledTimes(1)
  })
})
