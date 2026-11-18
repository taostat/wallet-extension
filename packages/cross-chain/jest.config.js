/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Only spec files: `src/__tests__` also holds the shared fixtures they import.
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
}
