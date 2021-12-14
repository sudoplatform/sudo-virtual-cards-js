class VirtualCardsError extends Error {
  constructor(msg?: string) {
    super(msg)
    this.name = this.constructor.name
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

/**
 * An error has occurred surrounding the state of the funding source being accessed.
 */
export class FundingSourceStateError extends VirtualCardsError {
  constructor(msg?: string) {
    super(msg)
  }
}

/**
 * The funding source has not been setup. Please ensure that `setupFundingSource` is called first.
 */
export class FundingSourceNotSetupError extends VirtualCardsError {
  constructor(msg?: string) {
    super(msg)
  }
}

/**
 * Provisional Funding source not found.
 *
 * The identifier used does not match any existing Provisional Funding Sources.
 */
export class ProvisionalFundingSourceNotFoundError extends VirtualCardsError {
  constructor(msg?: string) {
    super(msg)
  }
}

/**
 * The Funding Source is not found.
 *
 * The Funding Source attempted to be accessed does not exist or cannot be found.
 */
export class FundingSourceNotFoundError extends VirtualCardsError {
  constructor(msg?: string) {
    super(msg)
  }
}

/**
 * The Funding Source completion data is invalid.
 *
 * The completion data passed to `completeFundingSource` is invalid or corrupted.
 */
export class FundingSourceCompletionDataInvalidError extends VirtualCardsError {
  constructor(msg?: string) {
    super(msg)
  }
}

/**
 * The Funding Source attempted to be created already exists.
 */
export class DuplicateFundingSourceError extends VirtualCardsError {
  constructor(msg?: string) {
    super(msg)
  }
}

/**
 * The Funding Source is not acceptable. Please try another method.
 */
export class UnacceptableFundingSourceError extends VirtualCardsError {
  constructor(msg?: string) {
    super(msg)
  }
}

/**
 * The configuration has not been initialized for the Virtual Cards Client.
 */
export class VirtualCardsServiceConfigNotFoundError extends VirtualCardsError {
  constructor(msg?: string) {
    super(msg)
  }
}

/**
 * The card was not found on the api operation.
 */
export class CardNotFoundError extends VirtualCardsError {
  constructor(msg?: string) {
    super(msg)
  }
}
