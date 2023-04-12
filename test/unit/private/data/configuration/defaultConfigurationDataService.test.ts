/*
 * Copyright © 2023 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { instance, mock, reset, verify, when } from 'ts-mockito'
import { ApiClient } from '../../../../../src/private/data/common/apiClient'
import { DefaultVirtualCardsConfigService } from '../../../../../src/private/data/configuration/defaultConfigService'
import { EntityDataFactory } from '../../../data-factory/entity'
import { GraphQLDataFactory } from '../../../data-factory/graphQl'

describe('DefaultVirtualCardsConfigurationDataService Test Suite', () => {
  const mockAppSync = mock<ApiClient>()
  let instanceUnderTest: DefaultVirtualCardsConfigService

  beforeEach(() => {
    reset(mockAppSync)
    instanceUnderTest = new DefaultVirtualCardsConfigService(
      instance(mockAppSync),
    )
  })

  describe('getVirtualCardsConfig', () => {
    it('calls appsync correctly', async () => {
      when(mockAppSync.getVirtualCardsConfig()).thenResolve(
        GraphQLDataFactory.configurationData,
      )
      const result = await instanceUnderTest.getVirtualCardsConfig()
      verify(mockAppSync.getVirtualCardsConfig()).once()
      expect(result).toEqual(EntityDataFactory.configurationData)
    })
  })
})
