/*
 * completion-crossref.ts
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


import {
  CompletionItem,
  CompletionItemKind,
  MarkupKind,
} from "vscode-languageserver/node";

import { XRef } from "editor-types";

import { xrefsForFile } from "editor-server";

import { quartoContext } from "../../../quarto/quarto";

export async function crossrefCompletions(
  token: string,
  code: string,
  filePath: string,
  projectDir?: string
): Promise<CompletionItem[] | null> {

  if (quartoContext) {
    const xrefs = await xrefsForFile(quartoContext, filePath, code, projectDir);
    return xrefs
      .map(xrefCompletion(!!projectDir))
      .filter((ref) => ref.label.startsWith(token));
  } else {
    return null;
  }
}

function xrefCompletion(includeFilename: boolean) {
  return (xref: XRef): CompletionItem => ({
    kind: CompletionItemKind.Function,
    label: `${xref.type}-${xref.id}${xref.suffix || ""}`,
    documentation: xref.title
      ? {
          kind: MarkupKind.Markdown,
          value:
            xref.title + (includeFilename ? " — _" + xref.file + "_" : ""),
        }
      : undefined,
  });
}
