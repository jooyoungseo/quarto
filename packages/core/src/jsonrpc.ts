/*
 * jsonrpc.ts
 *
 * Copyright (C) 2022 by Posit Software, PBC
 *
 * Unless you have received this program directly from Posit Software pursuant
 * to the terms of a commercial license agreement with Posit Software, then
 * this program is licensed to you under the terms of version 3 of the
 * GNU Affero General Public License. This program is distributed WITHOUT
 * ANY EXPRESS OR IMPLIED WARRANTY, INCLUDING THOSE OF NON-INFRINGEMENT,
 * MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE. Please refer to the
 * AGPL (http://www.gnu.org/licenses/agpl-3.0.txt) for more details.
 *
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonRpcRequestTransport = (method: string, params: unknown[] | undefined) => Promise<any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonRpcServerMethod = (params: Array<any>) => Promise<unknown>;

export const kJsonRpcParseError = -32700;
export const kJsonRpcInvalidRequest = -32600;
export const kJsonRpcMethodNotFound = -32601;
export const kJsonRpcInvalidParams = -32602;
export const kJsonRpcInternalError = -32603;

export interface JsonRpcError {
  code: number;
  message: string;
  data?: object;
}

export function jsonRpcError(message: string, data?: string | object, code?: number) : JsonRpcError {
  if (typeof(data) === "string") {
    data = { description: data };
  } 
  return {
    code: code || -3200,
    message,
    data
  }
}

export function asJsonRpcError(error: unknown) {
  if (typeof(error) === "object") {
    const err = error as Record<string,unknown>;
    if (typeof(err.message) === "string") {
      return jsonRpcError(
        err.message, 
        err.data as string | object | undefined, 
        err.code as number | undefined)
      ;
    }
  } else {
    return jsonRpcError(String(error));
  }
}


export interface JsonRpcPostMessageTarget {
  postMessage: (data: unknown) => void;
  onMessage: (handler: (data: unknown) => void) => VoidFunction;
}

export function jsonRpcPostMessageRequestTransport(target: JsonRpcPostMessageTarget) : {
  request: JsonRpcRequestTransport,
  disconnect: VoidFunction
} {
  
  // track in-flight requests
  let requestId = 0;
  const requests = new Map<number, { resolve: (value: unknown) => void, reject: (reason: unknown) => void }>();

  // listen for responses
  const disconnect = target.onMessage(ev => {
    const response = asJsonRpcResponse(ev);
    if (response) {
      const request = requests.get(response.id);
      if (request) {
        requests.delete(response.id);
        if (response.result) {
          request.resolve(response.result);
        } else if (response.error) {
          request.reject(response.error);
        }
      }
    }
  });

  // return transport
  return {
    request: (method: string, params: unknown[] | undefined) => {
      return new Promise((resolve, reject) => {
        
        // track request
        const id = ++requestId;
        requests.set(id, { resolve, reject });
  
        // make request
        const request: JsonRpcRequest = {
          jsonrpc: kJsonRpcVersion,
          id,
          method,
          params
        };
        target.postMessage(request);
      });
    },
    disconnect
  };

}

export function jsonRpcPostMessageServer(
  target: JsonRpcPostMessageTarget, 
  methods: Record<string,JsonRpcServerMethod>
) {
  // listen for messages
  return target.onMessage(data => {
    const request = asJsonRpcRequest(data);
    if (request) {

      // lookup method
      const method = methods[request.method];
      if (!method) {
        target.postMessage(methodNotFoundResponse(request));
      }
      
      // dispatch method
      method(request.params || [])
        .then(value => {
          target.postMessage(jsonRpcResponse(request, value));
        })
        .catch(error => {
          target.postMessage({
            jsonrpc: request.jsonrpc,
            id: request.id,
            error: asJsonRpcError(error)
          })
        });
      }
  });
}

const kJsonRpcVersion = "2.0";

interface JsonRpcMessage {
  jsonrpc: string;
  id: number;
}

function isJsonRpcMessage(message: unknown): message is JsonRpcRequest {
  const jsMessage = message as JsonRpcMessage;
  return jsMessage.jsonrpc !== undefined && jsMessage.id !== undefined;
}

interface JsonRpcRequest extends JsonRpcMessage {
  method: string;
  params?: unknown[];
}

function isJsonRpcRequest(message: JsonRpcMessage): message is JsonRpcRequest {
  return (message as JsonRpcRequest).method !== undefined;
}

interface JsonRpcResponse extends JsonRpcMessage {
  result?: unknown;
  error?: JsonRpcError;
}

function isJsonRpcResponse(message: JsonRpcMessage): message is JsonRpcResponse {
  const response = message as JsonRpcResponse;
  return response.result !== undefined || response.error !== undefined; 
}

function asJsonRpcMessage(data: unknown) : JsonRpcMessage | null {
  if (isJsonRpcMessage(data) && data.jsonrpc === kJsonRpcVersion) {
    return data;
  } else {
    return null;
  }
}

function asJsonRpcRequest(data: unknown) : JsonRpcRequest | null {
  const message = asJsonRpcMessage(data);
  if (message && isJsonRpcRequest(message)) {
    return message;
  } else {
    return null;
  }
}

function asJsonRpcResponse(data: unknown) : JsonRpcResponse | null {
  const message = asJsonRpcMessage(data);
  if (message && isJsonRpcResponse(message)) {
    return message;
  } else {
    return null;
  }
}

function jsonRpcResponse(request: JsonRpcRequest, result?: unknown) {
  return {
    jsonrpc: request.jsonrpc,
    id: request.id,
    result
  }
}

function jsonRpcErrorResponse(request: JsonRpcRequest, code: number, message: string) {
  return {
    jsonrpc: request.jsonrpc,
    id: request.id,
    error: jsonRpcError(message, undefined, code)
  }
}

function methodNotFoundResponse(request: JsonRpcRequest) {
  return jsonRpcErrorResponse(
    request, kJsonRpcMethodNotFound, 
    `Method '${request.method} not found.`
  );
}



