/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import {getChildNodes, getFirstItem, getLastItem, getNthItem} from '@react-stately/collections';
import {GridCollection} from '@react-stately/grid';
import {GridNode} from '@react-types/grid';
import {TableCollection as ITableCollection} from '@react-types/table';
import {Key} from 'react';

interface GridCollectionOptions {
  showSelectionCheckboxes?: boolean,
  showDragButtons?: boolean
}

const ROW_HEADER_COLUMN_KEY = 'row-header-column-' + Math.random().toString(36).slice(2);
let ROW_HEADER_COLUMN_KEY_DRAG = 'row-header-column-' + Math.random().toString(36).slice(2);
while (ROW_HEADER_COLUMN_KEY === ROW_HEADER_COLUMN_KEY_DRAG) {
  ROW_HEADER_COLUMN_KEY_DRAG = 'row-header-column-' + Math.random().toString(36).slice(2);
}

/** @private */
export function buildHeaderRows<T>(keyMap: Map<Key, GridNode<T>>, columnNodes: GridNode<T>[]): GridNode<T>[] {
  if (columnNodes.length === 0) {
    return [];
  }

  let columns: GridNode<T>[][] = [];
  let seen = new Map();
  for (let column of columnNodes) {
    let parentKey = column.parentKey;
    let col = [column];

    while (parentKey) {
      let parent: GridNode<T> = keyMap.get(parentKey);
      if (!parent) {
        break;
      }

      // If we've already seen this parent, than it is shared
      // with a previous column. If the current column is taller
      // than the previous column, than we need to shift the parent
      // in the previous column so it's level with the current column.
      if (seen.has(parent)) {
        parent.colspan++;

        let {column, index} = seen.get(parent);
        if (index > col.length) {
          break;
        }

        for (let i = index; i < col.length; i++) {
          column.splice(i, 0, null);
        }

        // Adjust shifted indices
        for (let i = col.length; i < column.length; i++) {
          // eslint-disable-next-line max-depth
          if (column[i] && seen.has(column[i])) {
            seen.get(column[i]).index = i;
          }
        }
      } else {
        parent.colspan = 1;
        col.push(parent);
        seen.set(parent, {column: col, index: col.length - 1});
      }

      parentKey = parent.parentKey;
    }

    columns.push(col);
    column.index = columns.length - 1;
  }

  let maxLength = Math.max(...columns.map(c => c.length));
  let headerRows = Array(maxLength).fill(0).map(() => []);

  // Convert columns into rows.
  let colIndex = 0;
  for (let column of columns) {
    let i = maxLength - 1;
    for (let item of column) {
      if (item) {
        // Fill the space up until the current column with a placeholder
        let row = headerRows[i];
        let rowLength = row.reduce((p, c) => p + c.colspan, 0);
        if (rowLength < colIndex) {
          let placeholder: GridNode<T> = {
            type: 'placeholder',
            key: 'placeholder-' + item.key,
            colspan: colIndex - rowLength,
            index: rowLength,
            value: null,
            rendered: null,
            level: i,
            hasChildNodes: false,
            childNodes: [],
            textValue: null
          };

          // eslint-disable-next-line max-depth
          if (row.length > 0) {
            row[row.length - 1].nextKey = placeholder.key;
            placeholder.prevKey = row[row.length - 1].key;
          }

          row.push(placeholder);
        }

        if (row.length > 0) {
          row[row.length - 1].nextKey = item.key;
          item.prevKey = row[row.length - 1].key;
        }

        item.level = i;
        item.colIndex = colIndex;
        row.push(item);
      }

      i--;
    }

    colIndex++;
  }

  // Add placeholders at the end of each row that is shorter than the maximum
  let i = 0;
  for (let row of headerRows) {
    let rowLength = row.reduce((p, c) => p + c.colspan, 0);
    if (rowLength < columnNodes.length) {
      let placeholder: GridNode<T> = {
        type: 'placeholder',
        key: 'placeholder-' + row[row.length - 1].key,
        colspan: columnNodes.length - rowLength,
        index: rowLength,
        value: null,
        rendered: null,
        level: i,
        hasChildNodes: false,
        childNodes: [],
        textValue: null,
        prevKey: row[row.length - 1].key
      };

      row.push(placeholder);
    }

    i++;
  }

  return headerRows.map((childNodes, index) => {
    let row: GridNode<T> = {
      type: 'headerrow',
      key: 'headerrow-' + index,
      index,
      value: null,
      rendered: null,
      level: 0,
      hasChildNodes: true,
      childNodes,
      textValue: null
    };

    return row;
  });
}

export class TableCollection<T> extends GridCollection<T> implements ITableCollection<T> {
  headerRows: GridNode<T>[];
  columns: GridNode<T>[];
  rowHeaderColumnKeys: Set<Key>;
  body: GridNode<T>;
  _size: number = 0;

  constructor(nodes: Iterable<GridNode<T>>, prev?: ITableCollection<T>, opts?: GridCollectionOptions) {
    let rowHeaderColumnKeys: Set<Key> = new Set();
    let body: GridNode<T>;
    let columns: GridNode<T>[] = [];

    // Add cell for selection checkboxes if needed.
    if (opts?.showSelectionCheckboxes) {
      let rowHeaderColumn: GridNode<T> = {
        type: 'column',
        key: ROW_HEADER_COLUMN_KEY,
        value: null,
        textValue: '',
        level: 0,
        index: opts?.showDragButtons ? 1 : 0,
        hasChildNodes: false,
        rendered: null,
        childNodes: [],
        props: {
          isSelectionCell: true
        }
      };

      columns.unshift(rowHeaderColumn);
    }

    // Add cell for drag buttons if needed.
    if (opts?.showDragButtons) {
      let rowHeaderColumn: GridNode<T> = {
        type: 'column',
        key: ROW_HEADER_COLUMN_KEY_DRAG,
        value: null,
        textValue: '',
        level: 0,
        index: 0,
        hasChildNodes: false,
        rendered: null,
        childNodes: [],
        props: {
          isDragButtonCell: true
        }
      };

      columns.unshift(rowHeaderColumn);
    }

    let rows = [];
    let columnKeyMap = new Map();
    let visit = (node: GridNode<T>) => {
      switch (node.type) {
        case 'body':
          body = node;
          break;
        case 'column':
          columnKeyMap.set(node.key, node);
          if (!node.hasChildNodes) {
            columns.push(node);

            if (node.props.isRowHeader) {
              rowHeaderColumnKeys.add(node.key);
            }
          }
          break;
        case 'section':
          // Push section node to rows so that it gets added to the keymap via GridCollection
          rows.push(node);
          break;
        case 'item':
          rows.push(node);
          return; // do not go into childNodes
      }
      for (let child of node.childNodes) {
        visit(child);
      }
    };

    for (let node of nodes) {
      visit(node);
    }

    let headerRows = buildHeaderRows(columnKeyMap, columns) as GridNode<T>[];
    headerRows.forEach((row, i) => rows.splice(i, 0, row));

    super({
      columnCount: columns.length,
      items: rows,
      visitNode: node => {
        node.column = columns[node.index];
        // TODO: the "column" set here is applied onto the Section's row nodes and remain when retrieved
        // via the Section's childNodes generator call. However, GridCollection adds some more information on each Row such
        // as rowIndex which won't be reflected by the nodes retrieved from Section's childNodes call. They are instead stored in the
        // key map. How to fix this discrepency?
        // This is also a problem for non-sectioned tables, nodes from state.collection.keyMap contain more information than nodes retrieved from [...state.collection.body.childNodes]
        // TODO: Potentially refactor GridCollection so it takes in collection.body instead of rows, then make it do the same kind
        // of "visit" stategy where it dives into each nodes' childNodes and applies the extra rowNode information that it currently generates
        // to the row nodes retrieved from childNodes? This would mean taking the logic from the items.forEach and calling it when it finds a row/section node
        // in childNodes. Maybe just wait till we refactor collections as a whole and replace with RAC's collection approach
        return node;
      }
    });
    this.columns = columns;
    this.rowHeaderColumnKeys = rowHeaderColumnKeys;
    this.body = body;
    this.headerRows = headerRows;
    this._size = this.rows.length - headerRows.length;

    // Default row header column to the first one.
    if (this.rowHeaderColumnKeys.size === 0) {
      if (opts?.showSelectionCheckboxes) {
        if (opts?.showDragButtons) {
          this.rowHeaderColumnKeys.add(this.columns[2].key);
        } else {
          this.rowHeaderColumnKeys.add(this.columns[1].key);
        }
      } else {
        this.rowHeaderColumnKeys.add(this.columns[0].key);
      }
    }
  }

  *[Symbol.iterator]() {
    yield* this.body.childNodes;
  }

  get size() {
    return this._size;
  }

  getKeys() {
    return this.keyMap.keys();
  }

  getKeyBefore(key: Key) {
    let node = this.keyMap.get(key);
    return node ? node.prevKey : null;
  }

  getKeyAfter(key: Key) {
    let node = this.keyMap.get(key);
    return node ? node.nextKey : null;
  }

  getFirstKey() {
    // TODO this.body isn't in the keymap so can't use getChildNodes
    let key;
    let firstNode = getFirstItem(this.body.childNodes);
    if (firstNode != null && firstNode.type === 'item') {
      key = firstNode.key;
    } else if (firstNode.type === 'section') {
      key = getNthItem(getChildNodes(firstNode, this), 1)?.key;
    }
    return key;
  }

  getLastKey() {
    let key;
    let lastNode = getLastItem(this.body.childNodes);
    if (lastNode != null && lastNode.type === 'item') {
      key = lastNode.key;
    } else if (lastNode.type === 'section') {
      key = getLastItem(getChildNodes(lastNode, this))?.key;
    }
    return key;
  }

  getItem(key: Key) {
    return this.keyMap.get(key);
  }

  at(idx: number) {
    const keys = [...this.getKeys()];
    return this.getItem(keys[idx]);
  }
}
