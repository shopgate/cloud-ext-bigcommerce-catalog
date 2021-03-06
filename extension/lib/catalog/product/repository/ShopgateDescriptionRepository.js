class ShopgateProductDescriptionRepository {
  /**
   * @param {BigCommerce} apiVersion3Client
   */
  constructor (apiVersion3Client) {
    this._apiVersion3Client = apiVersion3Client
  }

  /**
   * @param {number} productId
   * @return {string}
   */
  async get (productId) {
    let dataDescription = (await this._apiVersion3Client.get(
      '/catalog/products/' + productId + '?include_fields=description'
    )).data.description

    return dataDescription
  }
}

module.exports = ShopgateProductDescriptionRepository
