/* eslint-env es2021 */
const SHARED_TAILWIND_CONFIG = require("taostats-ui/tailwind.config.cjs")

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...SHARED_TAILWIND_CONFIG,
  content: [
    "./src/**/*.{html,ts,tsx,svg}",
    "./public/*.html",
    "../../packages/taostats-ui/src/**/*.{html,ts,tsx,svg,css}",
  ],
}
