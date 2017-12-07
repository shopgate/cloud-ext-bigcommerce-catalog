const BigCommerceApi = require('node-bigcommerce')
const ProductListRepository = require('../../lib/catalog/ShopgateProductListRepository.js')
const ShopgateSort = require('../catalog/product/ShopgateSort.js')

const productListRepository = new ProductListRepository(
  new BigCommerceApi({
    logLevel: 'info',
    clientId: '***',
    accessToken: '***',
    storeHash: '***',
    responseType: 'json',
    apiVersion: 'v3'
  })
)

/**
 * @param {Object} context
 * @param {GetProductsInput} input - Properties depend on the pipeline this is used for
 * @param {GetProductsPipelineCallback} cb
 */
module.exports = function (context, input, cb) {
  const getByCategoryId = input.hasOwnProperty('categoryId') && input.categoryId
  const getByProductIds = input.hasOwnProperty('productIds') && input.productIds

  if (!getByCategoryId && !getByProductIds) {
    cb(null, {
      totalProductCount: 0,
      products: []
    })
  }

  if (getByProductIds) {
    productListRepository.getProductsResultForProductIds(
      input.productIds,
      input.hasOwnProperty('offset') ? input.offset : 0,
      input.hasOwnProperty('limit') ? input.limit : 20,
      input.hasOwnProperty('sort') ? input.sort : ShopgateSort.RANDOM,
      input.hasOwnProperty('showInactive') ? input.showInactive : false
    ).then(productResult => {
      cb(null, productResult)
    }).catch(e => {
      cb(new Error(e.message))
    })
  }

  if (getByCategoryId) {
    productListRepository.getProductResultForCategoryId(
      input.categoryId,
      input.hasOwnProperty('offset') ? input.offset : 0,
      input.hasOwnProperty('limit') ? input.limit : 20,
      input.hasOwnProperty('sort') ? input.sort : ShopgateSort.RANDOM,
      input.hasOwnProperty('showInactive') ? input.showInactive : false
    ).then(productResult => {
      cb(null, productResult)
    }).catch(e => {
      cb(new Error(e.message))
    })
  }
}
