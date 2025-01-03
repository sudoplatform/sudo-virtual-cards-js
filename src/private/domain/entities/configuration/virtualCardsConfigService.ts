/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { VirtualCardsConfigEntity } from './virtualCardsConfigEntity'

/**
 * Core entity representation of the configuration data service used in business logic. Used to retrieve configuration data.
 *
 * @interface VirtualCardsConfigService
 */
export interface VirtualCardsConfigService {
  /**
   * Retrieve the configuration data from the service.
   *
   * @returns {VirtualCardsConfigEntity} The configuration data for the email service.
   */
  getVirtualCardsConfig(): Promise<VirtualCardsConfigEntity>
}
