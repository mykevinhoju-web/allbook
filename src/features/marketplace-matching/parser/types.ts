import type { StructuredServiceRequest } from "../types";

/**
 * Pluggable request parser contract.
 * Phase 1: DemoRequestParser (rules / patterns).
 * Later: swap for AiRequestParser without changing the Matching Engine.
 */
export type RequestParser = {
  readonly id: string;
  parse(rawQuery: string, now?: Date): ParseResult;
};

export type ParseResult =
  | {
      ok: true;
      request: StructuredServiceRequest;
      confidence: number;
      matchedPattern: string;
      notes: string[];
    }
  | {
      ok: false;
      error: string;
      hints: string[];
    };
