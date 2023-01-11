/*
 * index.ts
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
  EditorDialogs, 
  EditorHTMLDialogCreateFn, 
  EditorHTMLDialogValidateFn, 
  EditorServer, 
  EditorUIImageResolver,  
} from "editor-types";

import { alert, yesNoMessage } from "./alert";
import { editAttr, editDiv, editSpan } from "./edit-attr";
import { editLink } from "./edit-link";
import { editImage } from "./edit-image";
import { editMath } from "./edit-math";
import { editList } from "./edit-list";
import { editRawInline, editRawBlock } from "./edit-raw";
import { editCodeBlock } from "./edit-codeblock";
import { editCallout } from "./edit-callout";
import { insertTable } from "./insert-table";
import { insertTabset } from "./insert-tabset";
import { insertCite } from "./insert-cite";
import { UITools } from "editor";

export { 
  alert, 
  yesNoMessage, 
  editAttr, 
  editDiv, 
  editSpan,
  editLink, 
  editMath, 
  editList, 
  editRawInline, 
  editRawBlock, 
  editCodeBlock, 
  editCallout,
  insertTable,
  insertCite
};


export function editorDialogs(
  uiTools: UITools, 
  server: EditorServer,
  imageResolver: EditorUIImageResolver) : EditorDialogs {
  return {
    alert,
    yesNoMessage,
    editLink: editLink(uiTools.attr),
    editImage: editImage(uiTools.attr, imageResolver),
    editCodeBlock: editCodeBlock(uiTools.attr),
    editList,
    editAttr: editAttr(uiTools.attr),
    editSpan: editSpan(uiTools.attr),
    editDiv: editDiv(uiTools.attr),
    editCallout: editCallout(uiTools.attr),
    editRawInline,
    editRawBlock,
    editMath,
    insertTable,
    insertTabset: insertTabset(uiTools.attr),
    insertCite: insertCite(server.doi, uiTools.citation),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async htmlDialog(_title: string, _okText: string | null, _create: EditorHTMLDialogCreateFn, _focus: VoidFunction, _validate: EditorHTMLDialogValidateFn): Promise<boolean> {
      return false;
    }
  };
} 

