# frozen_string_literal: true

require 'json'

module Reviews
  SORT_CLAUSE = {
    'newest' => '"createdAt" DESC',
    'oldest' => '"createdAt" ASC',
    'highest' => 'rating DESC',
    'lowest' => 'rating ASC',
    'helpful' => '"helpfulCount" DESC'
  }.freeze

  module_function

  def parse_list_params(params)
    page = positive_int(params['page']) || 1
    limit = positive_int(params['limit']) || 10
    limit = 50 if limit > 50
    limit = 1 if limit < 1

    sort = SORT_CLAUSE.key?(params['sort']) ? params['sort'] : 'newest'
    rating = positive_int(params['rating'])
    rating = nil unless rating && rating.between?(1, 5)

    { page: page, limit: limit, sort: sort, rating: rating }
  end

  def list(product_id, query)
    where = ['r."productId" = $1', %(r.status = 'APPROVED')]
    values = [product_id]

    if query[:rating]
      values << query[:rating]
      where << %(r.rating = $#{values.length})
    end

    where_sql = where.join(' AND ')
    offset = (query[:page] - 1) * query[:limit]
    order_sql = SORT_CLAUSE.fetch(query[:sort])

    values << query[:limit]
    limit_placeholder = "$#{values.length}"
    values << offset
    offset_placeholder = "$#{values.length}"

    reviews_sql = <<~SQL
      SELECT
        r.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'image', NULL
        ) AS user,
        COALESCE((
          SELECT json_agg(json_build_object('id', ri.id, 'url', ri.url, 'reviewId', ri."reviewId"))
          FROM "ReviewImage" ri
          WHERE ri."reviewId" = r.id
        ), '[]'::json) AS images
      FROM "Review" r
      INNER JOIN "User" u ON u.id = r."userId"
      WHERE #{where_sql}
      ORDER BY r.#{order_sql}
      LIMIT #{limit_placeholder} OFFSET #{offset_placeholder}
    SQL

    count_sql = <<~SQL
      SELECT COUNT(*)::int AS total
      FROM "Review" r
      WHERE #{where_sql}
    SQL

    breakdown_sql = <<~SQL
      SELECT r.rating, COUNT(*)::int AS count
      FROM "Review" r
      WHERE r."productId" = $1 AND r.status = 'APPROVED'
      GROUP BY r.rating
      ORDER BY r.rating DESC
    SQL

    reviews = Database.query_rows(reviews_sql, values)
    total = Database.query_one(count_sql, values[0...(values.length - 2)])['total'].to_i
    breakdown_rows = Database.query_rows(breakdown_sql, [product_id])

    {
      reviews: reviews.map { |row| format_review_row(row) },
      pagination: {
        page: query[:page],
        limit: query[:limit],
        total: total,
        totalPages: (total.to_f / query[:limit]).ceil
      },
      ratingBreakdown: breakdown_rows.map do |row|
        { rating: row['rating'], _count: row['count'] }
      end
    }
  end

  def format_review_row(row)
    images = row['images']
    images = JSON.parse(images) if images.is_a?(String)

    user = row['user']
    user = JSON.parse(user) if user.is_a?(String)

    review = JsonEncoding.row_to_hash(row.reject { |key, _| %w[user images].include?(key) })
    review['user'] = user
    review['images'] = images
    review
  end

  def positive_int(value)
    return nil if value.nil? || value.to_s.strip.empty?

    number = Integer(value, 10, exception: false)
    number&.positive? ? number : nil
  end
end
