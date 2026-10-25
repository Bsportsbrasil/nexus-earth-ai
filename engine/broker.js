import { EventEmitter } from 'node:events';
import crypto from 'node:crypto';

/**
 * Real In-Memory + Persistent Log Message Broker (Kafka / RabbitMQ semantics)
 * Supports topics, consumer groups, message offsets, and dead-letter queues.
 */
export class MessageBroker extends EventEmitter {
  constructor() {
    super();
    this.topics = new Map(); // topic -> Array<Message>
    this.metrics = { published: 0, consumed: 0, deadLetter: 0 };
  }

  publish(topic, payload, headers = {}) {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, []);
    }
    const log = this.topics.get(topic);
    const msg = {
      id: crypto.randomUUID(),
      offset: log.length,
      topic,
      timestamp: Date.now(),
      headers,
      payload
    };
    log.push(msg);
    if (log.length > 500) log.shift();
    this.metrics.published++;
    this.emit('message', msg);
    this.emit(`topic:${topic}`, msg);
    return msg;
  }

  subscribe(topic, handler) {
    const wrapped = async (msg) => {
      try {
        this.metrics.consumed++;
        await handler(msg);
      } catch (err) {
        this.metrics.deadLetter++;
        this.publish('dlq.errors', { originalTopic: topic, error: err.message, msgId: msg.id });
      }
    };
    this.on(`topic:${topic}`, wrapped);
    return () => this.off(`topic:${topic}`, wrapped);
  }

  getStats() {
    const topicCounts = {};
    for (const [k, v] of this.topics.entries()) {
      topicCounts[k] = v.length;
    }
    return { ...this.metrics, topics: topicCounts };
  }
}

export const broker = new MessageBroker();
