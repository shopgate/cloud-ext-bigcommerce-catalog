const ShopgateProductBuilder = require('../service/ShopgateProductBuilder')
const Sort = require('../value_objects/ShopgateSort.js')

class ShopgateProductListRepository {
  /**
   * @param {BigCommerce} apiVersion3Client
   * @param {BigCommerceRepository} bigCommerceStoreConfigurationRepository
   * @param {BigCommerceBrandRepository} bigCommerceBrandRepository
   */
  constructor (apiVersion3Client, bigCommerceStoreConfigurationRepository, bigCommerceBrandRepository) {
    this._apiVersion3Client = apiVersion3Client
    this._bigCommerceStoreConfigurationRepository = bigCommerceStoreConfigurationRepository
    this._bigCommerceBrandRepository = bigCommerceBrandRepository
  }

  /**
   * @param {string} categoryId
   * @param {number} offset
   * @param {number} limit
   * @param {string} sort
   * @param {boolean} showInactive
   * @returns {Promise<ShopgateProductsResponse>}
   */
  async getByCategoryId (categoryId, offset, limit, sort, showInactive) {
    const bigCommerceGetParameters = this._prepareParametersForGetProducts(offset, limit, sort, showInactive)

    bigCommerceGetParameters.push('categories:in=' + categoryId)

    /**
     * @type BigCommercePage
     */
    const firstPage = await this._apiVersion3Client.get('/catalog/products?' + bigCommerceGetParameters.join('&'))
    return this._getProducts([firstPage], firstPage.meta.pagination.total)
  }

  /**
   * @param {number} offset
   * @param {number} limit
   * @returns {number}
   *
   * @private
   */
  _calculateCurrentBigCommercePage (offset, limit) {
    return Math.floor(offset / limit) + 1
  }

  /**
   * @param {number} offset
   * @param {number} limit
   * @param {string} sort
   * @param {boolean} showInactive
   * @returns {string[]}
   *
   * @private
   */
  _prepareParametersForGetProducts (offset, limit, sort, showInactive) {
    const parameters = []

    if (!showInactive) {
      parameters.push('is_visible=1')
    }

    parameters.push('include=variants,images,bulk_pricing_rules')
    parameters.push('type=physical')
    parameters.push('availability=available')
    parameters.push('page=' + this._calculateCurrentBigCommercePage(offset, limit))
    parameters.push('limit=' + limit)

    Array.prototype.push.apply(parameters, this._getSortingParameters(sort))

    return parameters
  }

  /**
   * @param {string[]} productIds
   * @param {number} offset
   * @param {number} limit
   * @param {string} sort
   * @param {boolean} showInactive
   * @returns {Promise<ShopgateProductsResponse>}
   */
  async getByProductIds (productIds, offset, limit, sort, showInactive) {
    const pagePromises = []
    const bigCommerceGetParameters = this._prepareParametersForGetProducts(offset, limit, sort, showInactive)

    for (const productId of productIds) {
      pagePromises.push(this._apiVersion3Client.get('/catalog/products?' + bigCommerceGetParameters.join('&') + '&id=' + productId))
    }

    return this._getProducts(pagePromises, productIds.length)
  }

  /**
   * @param {Promise[]} pagePromises
   * @param {number} totalProductsCount
   * @returns {Promise<ShopgateProductsResponse>}
   *
   * @private
   */
  async _getProducts (pagePromises, totalProductsCount) {
    /**
     * @type {ShopgateProduct[]}
     */
    const products = []
    const bigCommerceProductReponses = await Promise.all(pagePromises)
    const bigCommerceStoreCurrency = await this._bigCommerceStoreConfigurationRepository.getCurrency()

    let promisesForBrands = []
    for (const bigCommerceProductRequest of bigCommerceProductReponses) {
      for (const bigCommerceProductData of bigCommerceProductRequest.data) {
        const shopgateProductBuilder = new ShopgateProductBuilder(bigCommerceProductData, bigCommerceStoreCurrency, 0)

        products.push(shopgateProductBuilder.build())

        promisesForBrands.push(this._bigCommerceBrandRepository.get(bigCommerceProductData.brand_id))
      }
    }
    const brands = await Promise.all(promisesForBrands)
    this._updateProductManufacturer(brands, products)

    return {
      totalProductCount: totalProductsCount,
      products: products
    }
  }

  /**
   * @param {string[]} brands
   * @param {ShopgateProduct[]} products
   *
   * @post products have the manufacturer property set if a name exists
   *
   * @private
   */
  _updateProductManufacturer (brands, products) {
    for (let i = 0; i < brands.length; ++i) {
      if (typeof brands[i] === 'undefined') {
        continue
      }

      products[i].manufacturer = brands[i]
    }
  }

  /**
   * @param {string} sort
   * @returns {string[]}
   *
   * @private
   */
  _getSortingParameters (sort) {
    const sortingParameters = []

    switch (sort) {
      case Sort.PRICE_ASC:
        sortingParameters.push('sort=price')
        sortingParameters.push('direction=asc')
        break
      case Sort.PRICE_DESC:
        sortingParameters.push('sort=price')
        sortingParameters.push('direction=desc')
        break
      case Sort.RELEVANCE:
        sortingParameters.push('sort=total_sold')
        sortingParameters.push('direction=desc')
        break
      case Sort.RANDOM:
      default:
        break
    }

    return sortingParameters
  }
}

module.exports = ShopgateProductListRepository
