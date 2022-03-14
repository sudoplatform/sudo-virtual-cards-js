import { instance, mock, reset, verify, when } from 'ts-mockito'
import { VirtualCardsConfigService } from '../../../../../../src/private/domain/entities/configuration/virtualCardsConfigService'
import { SudoUserService } from '../../../../../../src/private/domain/entities/sudoUser/sudoUserService'
import { GetVirtualCardsConfigUseCase } from '../../../../../../src/private/domain/use-cases/configuration/getConfigUseCase'
import { EntityDataFactory } from '../../../../data-factory/entity'

describe('GetVirtualCardsConfigurationDataUseCase', () => {
  const mockConfigurationDataService = mock<VirtualCardsConfigService>()
  const mockUserService = mock<SudoUserService>()

  let instanceUnderTest: GetVirtualCardsConfigUseCase

  beforeEach(() => {
    reset(mockConfigurationDataService)
    reset(mockUserService)
    instanceUnderTest = new GetVirtualCardsConfigUseCase(
      instance(mockConfigurationDataService),
      instance(mockUserService),
    )
    when(mockUserService.isSignedIn()).thenResolve(true)
  })

  describe('execute', () => {
    it('completes successfully', async () => {
      when(mockConfigurationDataService.getVirtualCardsConfig()).thenResolve(
        EntityDataFactory.configurationData,
      )
      const result = await instanceUnderTest.execute()
      verify(mockConfigurationDataService.getVirtualCardsConfig()).once()
      expect(result).toStrictEqual(EntityDataFactory.configurationData)
    })
  })
})
