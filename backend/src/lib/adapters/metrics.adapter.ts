/**
 * Metrics Adapter Interface
 *
 * Implement this interface to publish metrics to different backends
 * (Prometheus, DataDog, CloudWatch, etc.)
 */

export interface MetricValue {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: Date;
}

export interface IMetricsAdapter {
  /**
   * Record a counter metric
   */
  recordCounter(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Record a gauge metric
   */
  recordGauge(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Record a histogram metric (for durations)
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Flush metrics (if buffered)
   */
  flush(): Promise<void>;
}

/**
 * In-Memory Metrics Adapter (Default)
 * Stores metrics in memory for debugging
 */
export class InMemoryMetricsAdapter implements IMetricsAdapter {
  private metrics: MetricValue[] = [];

  recordCounter(name: string, value: number, labels?: Record<string, string>): void {
    this.metrics.push({
      name: `counter_${name}`,
      value,
      labels,
      timestamp: new Date(),
    });
  }

  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.metrics.push({
      name: `gauge_${name}`,
      value,
      labels,
      timestamp: new Date(),
    });
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    this.metrics.push({
      name: `histogram_${name}`,
      value,
      labels,
      timestamp: new Date(),
    });
  }

  async flush(): Promise<void> {
    if (this.metrics.length > 0) {
      console.log(`[METRICS] Flushing ${this.metrics.length} metrics`);
      // In a real implementation, this would send to a backend
      this.metrics = [];
    }
  }

  // Helper for debugging
  getAll(): MetricValue[] {
    return [...this.metrics];
  }

  clear(): void {
    this.metrics = [];
  }
}

/**
 * Logging Metrics Adapter
 * Logs all metrics to console (useful for debugging)
 */
export class LoggingMetricsAdapter implements IMetricsAdapter {
  recordCounter(name: string, value: number, labels?: Record<string, string>): void {
    this.log('COUNTER', name, value, labels);
  }

  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.log('GAUGE', name, value, labels);
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    this.log('HISTOGRAM', name, value, labels);
  }

  async flush(): Promise<void> {
    // Nothing to flush for logging adapter
  }

  private log(type: string, name: string, value: number, labels?: Record<string, string>): void {
    const labelsStr = labels ? ` {${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(', ')}}` : '';
    console.log(`[METRICS] ${type} ${name}${labelsStr} = ${value}`);
  }
}

/**
 * Prometheus Metrics Adapter (Stub)
 * TODO: Implement actual Prometheus integration using prom-client
 */
export class PrometheusMetricsAdapter implements IMetricsAdapter {
  private counters = new Map<string, any>();
  private gauges = new Map<string, any>();
  private histograms = new Map<string, any>();

  recordCounter(name: string, value: number, labels?: Record<string, string>): void {
    // Stub: In real implementation, use prom-client Counter
    console.log(`[PROMETHEUS] Counter ${name} += ${value}`, labels);
  }

  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    // Stub: In real implementation, use prom-client Gauge
    console.log(`[PROMETHEUS] Gauge ${name} = ${value}`, labels);
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    // Stub: In real implementation, use prom-client Histogram
    console.log(`[PROMETHEUS] Histogram ${name} observe ${value}`, labels);
  }

  async flush(): Promise<void> {
    // Prometheus pull model doesn't need flushing
  }
}
