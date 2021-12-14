import { TextDecoder, TextEncoder } from 'util'
// Workaround for `jsdom` test environment not providing TextEncoder and
// TextDecoder.
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// [START] - Polyfills
global.fetch = require('node-fetch')
require('isomorphic-fetch')
global.crypto = require('isomorphic-webcrypto')
// [END] - Polyfills
