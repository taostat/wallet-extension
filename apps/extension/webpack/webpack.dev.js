/* eslint-env es2021 */

const { merge } = require("webpack-merge")
const common = require("./webpack.common.js")
const path = require("path")
const CopyPlugin = require("copy-webpack-plugin")
const { SourceMapDevToolPlugin } = require("webpack")

const { updateManifestDetails, browser, getDistDir, manifestDir } = require("./utils.js")
const { BadgeIconsPlugin } = require("./badgeIcons.js")

console.log(`Building for ${browser} with dev config `)

/** @type { import('webpack').Configuration } */
const config = (env) => {
  const distDir = getDistDir(env)

  return merge(common(env), {
    devtool: false,
    mode: "development",
    watchOptions: {
      ignored: ["**/node_modules", "**/dist", "apps/extension/public/locales"],
    },
    plugins: [
      new SourceMapDevToolPlugin({
        // Here we are using a negative look-behind to exclude the `eval()` devtool from content_script.ts and page.ts.
        //
        // If either of these scripts have `eval` in them, the wallet will be unable to inject on dapps with a good
        // content security policy, like https://app.uniswap.org/swap for example.
        test: /(?<!(content_script|page))\.(ts|js|mts|mjs)/,
      }),
      new CopyPlugin({
        patterns: [
          {
            from: "common.json",
            to: path.join(distDir, "manifest.json"),
            context: manifestDir,
            transform: async (content) => {
              const manifest = await updateManifestDetails(env, JSON.parse(content.toString()))
              return JSON.stringify(manifest, null, 2)
            },
          },
          {
            from: ".",
            to: distDir,
            context: "public",
            // do not copy the manifest, it's handled separately
            globOptions: {
              ignore: [manifestDir].concat(
                // service worker should be excluded for firefox
                browser === "firefox" ? ["service_worker.js"] : [],
              ),
            },
          },
        ],
      }),
      new BadgeIconsPlugin({ build: env.build, outputPath: distDir }),
    ],
  })
}

module.exports = config
