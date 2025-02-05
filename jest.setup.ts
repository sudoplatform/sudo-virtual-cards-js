/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { TextDecoder, TextEncoder } from 'util'
// Workaround for `jsdom` test environment not providing TextEncoder and
// TextDecoder.
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as typeof global.TextDecoder

// [START] - Polyfills
global.fetch = require('node-fetch')
require('isomorphic-fetch')
// jsdom does some crypto polyfill magic but we want to use crypto.subtle so we need to add it back in
const localCrypto = require('crypto').webcrypto
global.crypto = localCrypto
// @ts-ignore
global.crypto.subtle = localCrypto.subtle

// [END] - Polyfills
