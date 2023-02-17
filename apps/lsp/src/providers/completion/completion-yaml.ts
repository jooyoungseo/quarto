/*
 * completion-yaml.ts
 *
 * Copyright (C) 2022 by Posit Software, PBC
 * Copyright (c) 2016 James Yu
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
  Range, 
  TextEdit, 
  Command, 
  CompletionItem, 
  CompletionItemKind, 
  MarkupKind 
} from "vscode-languageserver-types";


import { EditorContext, quarto } from "../../quarto/quarto";

export async function yamlCompletions(context: EditorContext) {
  // bail if no quarto connection
  if (!quarto) {
    return null;
  }

  // get completions
  const result = await quarto.getYamlCompletions(context);
  if (result) {
    // if there is one completion and it matches the token
    // then don't return it
    if (
      result.completions.length === 1 &&
      result.token === result.completions[0].value
    ) {
      return null;
    }

    // mqp our completions to vscode completions
    return result.completions.map((completion) => {
      const completionWord = completion.value.replace(/: $/, "");
      const item: CompletionItem = {
        label: completionWord,
        kind: CompletionItemKind.Field,
      };
      // strip tags from description
      if (completion.description) {
        item.documentation = {
          kind: MarkupKind.Markdown,
          value: decodeEntities(
            completion.description
              .replace(/(<([^>]+)>)/gi, "")
              .replace(/\n/g, " ")
          )
        }
      }
      if (result.token.length > 0 && completionWord.startsWith(result.token)) {
        const edit = TextEdit.replace(
          Range.create(
            context.position.row,
            context.position.column - result.token.length,
            context.position.row,
            context.position.column
          ),
          completion.value
        );
        item.textEdit = edit;
      } else {
        item.insertText = completion.value;
      }

      if (completion.suggest_on_accept) {
        item.command = Command.create(
          "Suggest",
          "editor.action.triggerSuggest"
        );
      }
      return item;
    });
  } else {
    return null;
  }
}

function decodeEntities(encodedString: string) {
  const translate_re = /&(nbsp|amp|quot|lt|gt);/g;
  const translate: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    quot: '"',
    lt: "<",
    gt: ">",
  };
  return encodedString
    .replace(translate_re, function (_match, entity: string) {
      return translate[entity];
    })
    .replace(/&#(\d+);/gi, function (_match, numStr) {
      const num = parseInt(numStr, 10);
      return String.fromCharCode(num);
    });
}
