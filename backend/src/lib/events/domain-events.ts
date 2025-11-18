/**
 * Domain Events System
 *
 * Define typed events that occur in the system.
 * These can be listened to by handlers for side effects (notifications, metrics, etc.)
 */

export interface DomainEvent {
  type: string;
  timestamp: Date;
  payload: any;
  metadata?: Record<string, any>;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface ServiceCreatedEvent extends DomainEvent {
  type: 'service.created';
  payload: {
    serviceId: string;
    serviceName: string;
  };
}

export interface ApiSpecUploadedEvent extends DomainEvent {
  type: 'apiSpec.uploaded';
  payload: {
    specId: string;
    serviceId: string;
    version: string;
  };
}

export interface ContractSuiteGeneratedEvent extends DomainEvent {
  type: 'contractSuite.generated';
  payload: {
    suiteId: string;
    serviceId: string;
    endpointCount: number;
  };
}

export interface TestRunStartedEvent extends DomainEvent {
  type: 'testRun.started';
  payload: {
    runId: string;
    suiteId: string;
    triggeredBy: string;
  };
}

export interface TestRunCompletedEvent extends DomainEvent {
  type: 'testRun.completed';
  payload: {
    runId: string;
    suiteId: string;
    status: string;
    duration: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
  };
}

export interface ContractBrokenEvent extends DomainEvent {
  type: 'contract.broken';
  payload: {
    runId: string;
    suiteId: string;
    serviceId: string;
    failedTests: Array<{
      endpoint: string;
      reason: string;
    }>;
  };
}

export interface SpecDiffDetectedEvent extends DomainEvent {
  type: 'specDiff.detected';
  payload: {
    oldSpecId: string;
    newSpecId: string;
    breakingChanges: number;
  };
}

export type AnyDomainEvent =
  | ServiceCreatedEvent
  | ApiSpecUploadedEvent
  | ContractSuiteGeneratedEvent
  | TestRunStartedEvent
  | TestRunCompletedEvent
  | ContractBrokenEvent
  | SpecDiffDetectedEvent;

// ============================================================================
// EVENT BUS
// ============================================================================

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Register an event handler
   */
  on<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventType) || [];
    this.handlers.set(eventType, [...existing, handler as EventHandler]);
  }

  /**
   * Emit an event
   */
  async emit(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    }
  }

  /**
   * Remove all handlers for an event type
   */
  off(eventType: string): void {
    this.handlers.delete(eventType);
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Global event bus instance
export const eventBus = new EventBus();

// ============================================================================
// EVENT EMITTERS (Helper functions)
// ============================================================================

export function emitServiceCreated(serviceId: string, serviceName: string): void {
  eventBus.emit({
    type: 'service.created',
    timestamp: new Date(),
    payload: { serviceId, serviceName },
  });
}

export function emitApiSpecUploaded(specId: string, serviceId: string, version: string): void {
  eventBus.emit({
    type: 'apiSpec.uploaded',
    timestamp: new Date(),
    payload: { specId, serviceId, version },
  });
}

export function emitContractSuiteGenerated(
  suiteId: string,
  serviceId: string,
  endpointCount: number,
): void {
  eventBus.emit({
    type: 'contractSuite.generated',
    timestamp: new Date(),
    payload: { suiteId, serviceId, endpointCount },
  });
}

export function emitTestRunStarted(runId: string, suiteId: string, triggeredBy: string): void {
  eventBus.emit({
    type: 'testRun.started',
    timestamp: new Date(),
    payload: { runId, suiteId, triggeredBy },
  });
}

export function emitTestRunCompleted(
  runId: string,
  suiteId: string,
  status: string,
  duration: number,
  totalTests: number,
  passedTests: number,
  failedTests: number,
): void {
  eventBus.emit({
    type: 'testRun.completed',
    timestamp: new Date(),
    payload: { runId, suiteId, status, duration, totalTests, passedTests, failedTests },
  });
}

export function emitContractBroken(
  runId: string,
  suiteId: string,
  serviceId: string,
  failedTests: Array<{ endpoint: string; reason: string }>,
): void {
  eventBus.emit({
    type: 'contract.broken',
    timestamp: new Date(),
    payload: { runId, suiteId, serviceId, failedTests },
  });
}

export function emitSpecDiffDetected(
  oldSpecId: string,
  newSpecId: string,
  breakingChanges: number,
): void {
  eventBus.emit({
    type: 'specDiff.detected',
    timestamp: new Date(),
    payload: { oldSpecId, newSpecId, breakingChanges },
  });
}
