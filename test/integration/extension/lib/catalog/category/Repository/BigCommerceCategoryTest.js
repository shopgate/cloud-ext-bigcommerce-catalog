const IntegrationCredentials = require('../../../../../../../.integration-credentials')
const BigCommerceCategory = require('../../../../../../../extension/lib/catalog/category/repository/BigCommerceCategory.js')
const BigCommerceFactory = require('../../../../../../../extension/lib/steps/BigCommerceFactory.js')
const BigCommerceRepositoryCommand = require('../../../../../../../extension/lib/catalog/category/factory/BigCommerceRepositoryCommand')
const chai = require('chai')
const chaiSubset = require('chai-subset')
const chaiAsPromised = require('chai-as-promised')

chai
  .use(chaiSubset)
  .use(chaiAsPromised)
  .should()

describe('BigcommerceCategoryTest', function () {
  const bigCommerceCategoryRepositoryCommandFactory = new BigCommerceRepositoryCommand(
    new BigCommerceFactory(
      IntegrationCredentials.clientId,
      IntegrationCredentials.accessToken,
      IntegrationCredentials.storeHash
    )
  )

  describe('#getRootCategories', function () {
    it('calls GetAllVisibleCategoriesByParentId#execute', function () {
      const subjectUnderTest = new BigCommerceCategory(bigCommerceCategoryRepositoryCommandFactory)

      return subjectUnderTest.getRootCategories().should.eventually.containSubset([
        {
          id: 19,
          imageUrl: '',
          name: 'Integration test *Do not touch*',
          productCount: 3
        }
      ])
    })
  })
})
