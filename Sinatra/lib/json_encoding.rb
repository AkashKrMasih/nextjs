# frozen_string_literal: true

require 'bigdecimal'
require 'json'
require 'time'

module JsonEncoding
  module_function

  def encode(value)
    JSON.generate(deep_encode(value))
  end

  def deep_encode(value)
    case value
    when Hash
      value.transform_values { |entry| deep_encode(entry) }
    when Array
      value.map { |entry| deep_encode(entry) }
    when Time
      value.utc.iso8601(3)
    when DateTime
      value.to_time.utc.iso8601(3)
    when BigDecimal
      value.to_s('F')
    else
      value
    end
  end

  def row_to_hash(row)
    row.each_with_object({}) do |(key, value), hash|
      hash[key] = deep_encode(value)
    end
  end

  def product_row_to_hash(row)
    hash = row_to_hash(row)
    hash['friendlyId'] = hash.delete('friendly_id') if hash.key?('friendly_id')
    hash
  end
end
