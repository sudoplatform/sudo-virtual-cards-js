/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import JSDOMEnvironment from 'jest-environment-jsdom'
import { TextDecoder, TextEncoder } from 'util'
import waitForExpect from 'wait-for-expect'
import { setImmediate } from 'timers'
import dotenv from 'dotenv'
import { webcrypto } from 'crypto'

dotenv.config({ quiet: true })

waitForExpect.defaults.interval = 500
waitForExpect.defaults.timeout = 30000

global.setImmediate = setImmediate

export default class JSDomEnvironmentPlusMissing extends JSDOMEnvironment {
  constructor(...args: ConstructorParameters<typeof JSDOMEnvironment>) {
    super(...args)

    // Workaround for `jsdom` test environment not providing structuredClone.
    this.global.structuredClone = structuredClone
    // Workaround for `jsdom` test environment not providing TextEncoder and
    // TextDecoder.
    this.global.TextEncoder = TextEncoder as typeof global.TextEncoder
    this.global.TextDecoder = TextDecoder as typeof global.TextDecoder

    // Add proper crypto support for v17 sudo-user JWT operations
    if (!this.global.crypto || !this.global.crypto.subtle) {
      Object.defineProperty(this.global, 'crypto', {
        value: webcrypto,
        writable: true,
        configurable: true,
      })
    }

    // Ensure proper fetch support.
    // Assign Node's native fetch globals to the jsdom environment.
    // stripe v22 requires standard Web Fetch API (not node-fetch).
    // Other SDKs (sudo-profiles, etc.) also use fetch.
    this.global.fetch = globalThis.fetch
    this.global.Request = globalThis.Request
    this.global.Response = globalThis.Response
    this.global.Headers = globalThis.Headers

    // Fix Uint8Array for jose library compatibility
    // jose requires actual Uint8Array instances, not jsdom's version
    this.global.Uint8Array = Uint8Array
    this.global.ArrayBuffer = ArrayBuffer
  }
}
