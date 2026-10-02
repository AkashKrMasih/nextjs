# frozen_string_literal: true

require 'dotenv/load'
require 'sinatra/base'
require 'json'

require_relative 'lib/database'
require_relative 'lib/json_encoding'
require_relative 'lib/home_catalog'
require_relative 'lib/reviews'

class ShopApi < Sinatra::Base
  configure do
    set :show_exceptions, development?
    set :raise_errors, development?
    disable :logging if ENV['RACK_ENV'] == 'test'
  end

  before do
    content_type 'application/json'
  end

  helpers do
    def json_response(body, status = 200)
      halt status, JsonEncoding.encode(body)
    end

    def positive_id(param)
      number = Integer(param, 10, exception: false)
      number&.positive? ? number : nil
    end
  end

  get '/health' do
    json_response({ ok: true })
  end

  # GET /api/categories — mirrors app/api/categories/route.ts
  get '/api/categories' do
    rows = Database.query_rows(
      <<~SQL
        SELECT id, name, slug, description, "parentId"
        FROM "Category"
        ORDER BY name ASC
      SQL
    )
    json_response(rows.map { |row| JsonEncoding.row_to_hash(row) })
  end

  # GET /api/products — mirrors app/api/products/route.ts
  get '/api/products' do
    rows = Database.query_rows(
      <<~SQL
        SELECT
          p.*,
          COALESCE((
            SELECT json_agg(
              json_build_object(
                'id', pi.id,
                'url', pi.url,
                'isPrimary', pi."isPrimary",
                'productId', pi."productId"
              )
              ORDER BY pi."isPrimary" DESC, pi.id ASC
            )
            FROM "ProductImage" pi
            WHERE pi."productId" = p.id
          ), '[]'::json) AS images
        FROM "Product" p
        ORDER BY p."createdAt" DESC
      SQL
    )

    products = rows.map do |row|
      product = JsonEncoding.product_row_to_hash(row.reject { |key, _| key == 'images' })
      images = row['images']
      images = JSON.parse(images) if images.is_a?(String)
      product['images'] = images
      product
    end

    json_response(products)
  end

  # GET /api/products/:id — mirrors app/api/products/[id]/route.ts
  get '/api/products/:id' do
    id = positive_id(params['id'])
    return json_response({ error: 'Invalid id' }, 400) unless id

    row = Database.query_one('SELECT * FROM "Product" WHERE id = $1', [id])
    return json_response({ error: 'Not found' }, 404) unless row

    json_response(JsonEncoding.product_row_to_hash(row))
  end

  # GET /api/home-catalog — mirrors app/api/home-catalog/route.ts
  get '/api/home-catalog' do
    filters = HomeCatalog.parse_filters(params)
    sql, values = HomeCatalog.build_query(filters)
    rows = Database.query_rows(sql, values)

    json_response(
      {
        hasFilters: filters[:has_filters],
        products: rows.map { |row| HomeCatalog.serialize_row(row) }
      }
    )
  end

  # GET /api/products/:id/reviews — mirrors app/api/products/[id]/reviews/route.ts
  get '/api/products/:id/reviews' do
    product_id = positive_id(params['id'])
    return json_response({ error: 'Invalid id' }, 400) unless product_id

    exists = Database.query_one('SELECT 1 FROM "Product" WHERE id = $1', [product_id])
    return json_response({ error: 'Not found' }, 404) unless exists

    query = Reviews.parse_list_params(params)
    if params['rating'] && query[:rating].nil?
      return json_response(
        { error: 'Invalid query params', details: { rating: ['invalid'] } },
        400
      )
    end

    json_response(Reviews.list(product_id, query))
  end

  error PG::Error do |exception|
    logger.error(exception.full_message) if respond_to?(:logger) && logger
    json_response({ error: 'Database error' }, 500)
  end
end
