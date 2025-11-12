// This file defines the data structure for the manufacturer's request.
// It will be a JSON object like: { "serialNumbers": ["sn-123", "sn-124"] }

export class RegisterBatchDto {
  serialNumbers: string[];
}