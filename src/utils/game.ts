import { invoke } from '@tauri-apps/api'
import { getConfig } from './configuration'

export async function getGameExecutable() {
  const config = await getConfig()

  if (!config.game_install_path) {
    return null
  }

  const pathArr = config.game_install_path.replace(/\\/g, '/').split('/')
  return pathArr[pathArr.length - 1]
}

export async function getGrasscutterJar() {
  const config = await getConfig()

  if (!config.grasscutter_path) {
    return null
  }

  const pathArr = config.grasscutter_path.replace(/\\/g, '/').split('/')
  return pathArr[pathArr.length - 1]
}

export async function getGameFolder() {
  const config = await getConfig()

  if (!config.game_install_path) {
    return null
  }

  const pathArr = config.game_install_path.replace(/\\/g, '/').split('/')
  pathArr.pop()

  const path = pathArr.join('/')

  return path
}

export async function getGameDataFolder() {
  const gameExec = await getGameExecutable()

  if (!gameExec) {
    return null
  }

  return (await getGameFolder()) + '\\' + gameExec.replace('.exe', '_Data')
}

export async function getGameVersion() {
  const GameData = await getGameDataFolder()
  const platform = await invoke('get_platform')

  if (!GameData) {
    return null
  }

  let hasAsb = await invoke('dir_exists', {
    path: GameData + '\\StreamingAssets\\asb_settings.json',
  })

  if (platform != 'windows') {
    hasAsb = await invoke('dir_exists', {
      path: GameData + '/StreamingAssets/asb_settings.json',
    })
  }

  if (!hasAsb) {
    // For games that cannot determine game version
    let otherGameVer: string = await invoke('read_file', {
      path: GameData + '\\StreamingAssets\\BinaryVersion.bytes',
    })

    if (platform != 'windows') {
      otherGameVer = await invoke('read_file', {
        path: GameData + '/StreamingAssets/BinaryVersion.bytes',
      })
    }

    const versionRaw = otherGameVer.split('.')
    const version = {
      major: parseInt(versionRaw[0]),
      minor: parseInt(versionRaw[1]),
      // This will probably never matter, just use major/minor. If needed, full version values are near EOF
      release: 0,
    }

    if (otherGameVer == null || otherGameVer.length < 1) {
      return null
    }

    return version
  }

  const settings = JSON.parse(
    await invoke('read_file', {
      path: GameData + '\\StreamingAssets\\asb_settings.json',
    })
  )

  const versionRaw = settings.variance.split('.')
  const version = {
    major: parseInt(versionRaw[0]),
    minor: parseInt(versionRaw[1].split('_')[0]),
    release: parseInt(versionRaw[1].split('_')[1]),
  }

  return version
}
