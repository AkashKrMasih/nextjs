# frozen_string_literal: true

module HomeCatalog
  SORTS = %w[newest price title].freeze

  module_function

  def parse_filters(params)
    query = params['q']&.strip || ''
    category_id = positive_int(params['category'])
    min_price = non_negative_number(params['min'])
    max_price = non_negative_number(params['max'])
    sort = SORTS.include?(params['sort']) ? params['sort'] : 'newest'

    has_filters = !query.empty? || category_id || !min_price.nil? || !max_price.nil?

    {
      query: query,
      category_id: category_id,
      min_price: min_price,
      max_price: max_price,
      sort: sort,
      has_filters: has_filters
    }
  end

  def build_query(filters)
    clauses = []
    values = []

    if filters[:category_id]
      values << filters[:category_id]
      clauses << %(p."categoryId" = $#{values.length})
    end

    if filters[:min_price]
      values << filters[:min_price]
      clauses << %(p.price >= $#{values.length})
    end

    if filters[:max_price]
      values << filters[:max_price]
      clauses << %(p.price <= $#{values.length})
    end

    unless filters[:query].empty?
      values << "%#{filters[:query]}%"
      placeholder = "$#{values.length}"
      clauses << %((
        p.name ILIKE #{placeholder}
        OR p.description ILIKE #{placeholder}
      ))
    end

    where_sql = clauses.empty? ? '' : "WHERE #{clauses.join(' AND ')}"

    order_sql =
      case filters[:sort]
      when 'price' then 'ORDER BY p.price ASC'
      when 'title' then 'ORDER BY p.name ASC'
      else 'ORDER BY p."createdAt" DESC'
      end

    sql = <<~SQL
      SELECT
        p.id,
        p."friendly_id" AS "friendlyId",
        p.name,
        p.price,
        (
          SELECT pi.url
          FROM "ProductImage" pi
          WHERE pi."productId" = p.id
          ORDER BY pi."isPrimary" DESC, pi.id ASC
          LIMIT 1
        ) AS image_url,
        COALESCE((
          SELECT SUM(i.quantity)
          FROM "ProductVariant" pv
          LEFT JOIN "Inventory" i ON i."variantId" = pv.id
          WHERE pv."productId" = p.id
        ), 0) AS stock
      FROM "Product" p
      #{where_sql}
      #{order_sql}
    SQL

    [sql, values]
  end

  def serialize_row(row)
    {
      id: row['id'],
      friendlyId: row['friendlyId'],
      name: row['name'],
      price: row['price'].to_s,
      imageUrl: row['image_url'],
      stock: row['stock'].to_i,
      wishlisted: false
    }
  end

  def positive_int(value)
    return nil if value.nil? || value.to_s.strip.empty?

    number = Integer(value, 10, exception: false)
    number&.positive? ? number : nil
  end

  def non_negative_number(value)
    return nil if value.nil? || value.to_s.strip.empty?

    number = Float(value, exception: false)
    return nil unless number && number.finite? && number >= 0

    number
  end
end
