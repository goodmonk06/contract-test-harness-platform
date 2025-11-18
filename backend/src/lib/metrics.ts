/**
 * Metrics Collection Utility
 *
 * Provides a simple interface to record metrics
 * Uses the configured metrics adapter
 */

import { IMetricsAdapter, InMemoryMetricsAdapter } from './adapters/metrics.adapter';

class MetricsCollector {
  private adapter: IMetricsAdapter = new InMemoryMetricsAdapter();

  /**
   * Set the metrics adapter
   */
  setAdapter(adapter: IMetricsAdapter): void {
    this.adapter = adapter;
  }

  /**
   * Record a counter (increments)
   */
  counter(name: string, value: number = 1, labels?: Record<string, string>): void {
    this.adapter.recordCounter(name, value, labels);
  }

  /**
   * Record a gauge (current value)
   */
  gauge(name: string, value: number, labels?: Record<string, string>): void {
    this.adapter.recordGauge(name, value, labels);
  }

  /**
   * Record a histogram (for durations, sizes, etc.)
   */
  histogram(name: string, value: number, labels?: Record<string, string>): void {
    this.adapter.recordHistogram(name, value, labels);
  }

  /**
   * Record duration (convenience method for timing operations)
   */
  duration(name: string, durationMs: number, labels?: Record<string, string>): void {
    this.histogram(`${name}_duration_ms`, durationMs, labels);
  }

  /**
   * Create a timer that records duration when stopped
   */
  startTimer(name: string, labels?: Record<string, string>): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.duration(name, duration, labels);
    };
  }

  /**
   * Flush metrics (if adapter supports buffering)
   */
  async flush(): Promise<void> {
    await this.adapter.flush();
  }
}

// Global metrics instance
export const metrics = new MetricsCollector();

// Common metric names (for consistency)
export const MetricNames = {
  // HTTP metrics
  HTTP_REQUESTS_TOTAL: 'http_requests_total',
  HTTP_REQUEST_DURATION: 'http_request_duration',

  // Test metrics
  TEST_RUNS_TOTAL: 'test_runs_total',
  TEST_DURATION: 'test_duration',
  TESTS_EXECUTED: 'tests_executed',
  TESTS_PASSED: 'tests_passed',
  TESTS_FAILED: 'tests_failed',

  // Service metrics
  SERVICES_TOTAL: 'services_total',
  API_SPECS_TOTAL: 'api_specs_total',
  CONTRACT_SUITES_TOTAL: 'contract_suites_total',

  // System metrics
  DB_QUERY_DURATION: 'db_query_duration',
  CACHE_HIT: 'cache_hit',
  CACHE_MISS: 'cache_miss',
};
