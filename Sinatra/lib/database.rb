# frozen_string_literal: true

require 'pg'
require 'uri'

module Database
  module_function

  def connection
    @connection ||= PG.connect(normalize_database_url(ENV.fetch('DATABASE_URL')))
  end

  def exec(sql, params = [])
    connection.exec_params(sql, params)
  end

  def query_rows(sql, params = [])
    exec(sql, params).to_a
  end

  def query_one(sql, params = [])
    query_rows(sql, params).first
  end

  def reset!
    @connection&.close
    @connection = nil
  end

  def normalize_database_url(url)
    raise 'DATABASE_URL is not set' if url.nil? || url.strip.empty?
    uri = URI.parse(url)
    return url unless uri.query

    params = URI.decode_www_form(uri.query).reject { |key, _| key == 'schema' }
    uri.query = params.empty? ? nil : URI.encode_www_form(params)
    uri.to_s
  end
end
