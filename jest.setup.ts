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
global.crypto = require('isomorphic-webcrypto')
// [END] - Polyfills
