const ShopgateCategoryRepository = require('../catalog/category/repository/Shopgate')
const BigCommerceFactory = require('./BigCommerceFactory.js')
const BigcommerceRepositoryCommand = require('../catalog/category/factory/RepositoryCommand')
const ApiTimings = require('./BigCommerceTimings')

/**
 * @param {Object} context
 * @returns {Promise<GetRootCategoriesResponse>}
 */
module.exports = async (context) => {
  let cacheConfig = {}
  if (context.config.cache) {
    cacheConfig = {
      cacheLifetime: context.config.cache.lifetime_sec,
      extensionStorage: context.storage.extension
    }
  }
  const bigCommerceFactory = new BigCommerceFactory(
    context.config.clientId,
    context.config.accessToken,
    context.config.storeHash,
    cacheConfig
  )
  const bigCommerceClientV3 = bigCommerceFactory.createV3()
  const shopgateCategoryRepository = new ShopgateCategoryRepository(
    new BigcommerceRepositoryCommand(
      bigCommerceClientV3
    )
  )
  const apiTimings = new ApiTimings(context.log)

  try {
    const categories = (await shopgateCategoryRepository.getRootCategories()).map(category => category.toShopgateRootCategory())

    context.log.debug('Successfully executed @shopgate/bigcommerce-catalog/getRootCategories_v1.')
    context.log.debug('Result: ' + JSON.stringify(categories))

    return {categories: categories}
  } catch (error) {
    context.log.error('Failed executing @shopgate/bigcommerce-catalog/getRootCategories_v1.')
    throw error
  } finally {
    apiTimings.report(bigCommerceClientV3.timings)
  }
}
