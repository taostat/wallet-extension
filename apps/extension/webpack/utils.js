/* eslint-env es2021 */

const childProcess = require("child_process")
const { readFileSync, existsSync } = require("fs")
const { readFile } = require("fs/promises")
const path = require("path")
const sentryWebpackPlugin = require("@sentry/webpack-plugin").sentryWebpackPlugin

const rootDir = path.join(__dirname, "..")
const srcDir = path.join(rootDir, "src")
const packageJson = JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf8"))
const packageVersion = process.env.npm_package_version || packageJson.version

const ValidBrowsers = ["chrome", "firefox"]
const browser = ValidBrowsers.includes(process.env.BROWSER?.toLowerCase())
  ? process.env.BROWSER.toLowerCase()
  : "chrome"
const useOneDistDir = Boolean(process.env.USE_ONE_DIST_DIR)
const publicDir = path.join(rootDir, "public")
const manifestDir = path.join(publicDir, "manifest")
const internalPublicKeyPath = path.join(rootDir, "keys", "internal-public-key.txt")

/** Named non-prod channels that get a distinct Chrome label / inject identity. */
const LABELED_BUILDS = new Set(["dev", "internal", "qa"])

const getDistDir = (env) => {
  if (useOneDistDir) return path.join(rootDir, "dist")
  const build = env?.build
  // Keep production at dist/<browser> for familiar store packaging paths.
  if (!build || build === "production") return path.join(rootDir, "dist", browser)
  return path.join(rootDir, "dist", `${browser}-${build}`)
}

const getGitShortHash = () => {
  try {
    return (
      process.env.COMMIT_SHA_SHORT ??
      childProcess.execSync("git rev-parse --short HEAD").toString().trim()
    )
  } catch (error) {
    const fallback = process.env.COMMIT_SHA ?? ""
    // eslint-disable-next-line no-console
    console.error(`Failed to get git short hash, using '${fallback}' as fallback`, error)
    return fallback
  }
}

const getRelease = (env) => {
  if (env.build === "production") return packageVersion
  return getGitShortHash()
}

const getArchiveFileName = (env) => {
  switch (env.build) {
    case "ci":
      return `taostats_extension_ci_${getGitShortHash() ?? Date.now()}_${browser}.zip`
    case "internal":
      return `taostats_extension_v${packageVersion}_${getGitShortHash()}_internal_${browser}.zip`
    case "production":
      return `taostats_extension_v${packageVersion}_${browser}.zip`
    default:
      return `taostats_extension_${getGitShortHash()}_${browser}.zip`
  }
}

const getManifestVersionName = (env) => {
  switch (env.build) {
    case "ci":
      return `${packageVersion} - ${getGitShortHash() ?? Date.now()} ci`
    case "internal":
      return `${packageVersion} - ${getGitShortHash()} internal`
    case "production":
      return packageVersion
    case "qa":
      return `${packageVersion} - ${getGitShortHash()} qa`
    default:
      return `${packageVersion} - ${getGitShortHash()} dev`
  }
}

const readInternalPublicKey = () => {
  if (!existsSync(internalPublicKeyPath)) return ""
  return readFileSync(internalPublicKeyPath, "utf8").trim()
}

const getInjectedWeb3Name = (build) => {
  if (!build || build === "production") return "taostats"
  return `taostats-${build}`
}

const getMsgOriginPage = (build) => {
  if (!build || build === "production") return "taostats-page"
  return `taostats-${build}-page`
}

const getMsgOriginContent = (build) => {
  if (!build || build === "production") return "taostats-content"
  return `taostats-${build}-content`
}

const getSentryPlugin = (env) => {
  if (!["production", "internal"].includes(env.build)) return

  // only the person or bot that builds for store release should have an auth token
  if (!process.env.SENTRY_AUTH_TOKEN) {
    console.warn("Missing SENTRY_AUTH_TOKEN env variable, release won't be uploaded to Sentry")
    return
  }

  const distDir = getDistDir(env)

  return sentryWebpackPlugin({
    // see https://docs.sentry.io/product/cli/configuration/ for details
    authToken: process.env.SENTRY_AUTH_TOKEN,
    org: "taostats",
    project: "taostats-extension",
    release: getRelease(env),
    cleanArtifacts: true,
    sourcemaps: {
      assets: [`${distDir}/**`],
      ignore: [`${distDir}/content_script.js`, `${distDir}/page.js`],
      deleteFilesAfterUpload: [`${distDir}/**/*.map`],
    },
  })
}

const updateManifestDetails = async (env, manifest) => {
  const data = await readFile(path.join(manifestDir, `${browser}.json`), "utf-8")
  const browserSpecificManifestDetails = JSON.parse(data)

  // Update the version in the manifest file to match the version in package.json
  manifest.version = packageVersion

  // add a version name key to distinguish in list of installed extensions (only for chrome)
  if (browser === "chrome") {
    manifest.version_name = getManifestVersionName(env)
    // Side panel opens via chrome.sidePanel.setPanelBehavior — default_popup takes precedence if set
    delete manifest.action?.default_popup
  }

  if (LABELED_BUILDS.has(env.build)) {
    const label = env.build
    manifest.name = `[${label}] - ${manifest.name}`
    manifest.action.default_title = `[${label}] - ${manifest.action.default_title}`
  }

  if (env.build === "internal") {
    const key = readInternalPublicKey()
    if (!key) {
      throw new Error(
        `Internal build requires a public key at ${internalPublicKeyPath}. See apps/extension/keys/README.md.`,
      )
    }
    manifest.key = key
  }

  // Belt-and-braces: never ship the internal key (or any key) in a store production build.
  if (env.build === "production") {
    const internalKey = readInternalPublicKey()
    const serialized = JSON.stringify(manifest)
    if (manifest.key) {
      throw new Error("Production manifest must not include a \"key\" field")
    }
    if (internalKey && serialized.includes(internalKey)) {
      throw new Error("Production manifest must not contain the internal extension public key")
    }
  }

  return { ...manifest, ...browserSpecificManifestDetails }
}

const getSupportedLanguages = () => {
  const localesPath = path.join("./public/locales/languages.json")
  return readFileSync(localesPath, "utf8")
}

module.exports = {
  browser,
  srcDir,
  getDistDir,
  publicDir,
  manifestDir,
  updateManifestDetails,
  getGitShortHash,
  getRelease,
  getManifestVersionName,
  getArchiveFileName,
  getSentryPlugin,
  getSupportedLanguages,
  getInjectedWeb3Name,
  getMsgOriginPage,
  getMsgOriginContent,
  readInternalPublicKey,
  LABELED_BUILDS,
  packageVersion,
}
