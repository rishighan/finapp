angular.module('finapp').factory('Utility', function () {

  function safeApply(scope, fn) {
    (scope.$$phase || scope.$root.$$phase) ? fn() : scope.$apply(fn);
  }

  function getDataToSendToServer (data, grid) {
    var i, iLen, z, zLen, x, xLen;
    var tables = [];

    for(i=0, iLen=data.length; i<iLen; i++) {
      var currentTable = data[i];
      var table = {
        title: grid[i].title,
        rows: [],
        summary: []
      };

      for(z=0,zLen=currentTable.length; z<zLen; z++) {

        var currentRow = currentTable[z];
        var row = [];

        for(index in currentRow) {
          var cell = {
            value: currentRow[index]
          };

          row.push(cell);
        }
        
        console.log('row: ');
        console.log(row);

        if (!isLastItem(z, zLen)) {
          table.rows.push(row);
        } else {
          table.summary.push(row);
        }

      }

      tables.push(table);
    }

    return tables;
  }

  function isLastItem (currentIndex, length) {
    return currentIndex === length - 1;
  }

  function getDataBasedOnTableFormat (columns, tables) {
    var i, x, xLen, iLen, newTable;
    var newTables = [];

    for(x=0, xLen=tables.length; x<xLen; x++) {
      newTable = [];
      var currentTable = tables[x];

      for(i=0,iLen=currentTable.rows.length; i<iLen; i++) {
        var currentRow = currentTable.rows[i];
        var item = getItem(currentRow, columns);
        newTable.push(item);
      }

      var summaryRow = currentTable.summary;
      var summaryItem = getItem(summaryRow, columns);

      newTable.push(summaryItem);

      if (newTable && newTable.length > 0) {
        newTables.push(newTable);
      }
    }

    return newTables;
  }

  function getGridasedOnTableFormat (nameData, columns, tables) {
    var i, iLen, z, zLen;
    var grid = [];

    for(i=0,iLen=tables.length; i<iLen; i++) {
      var item = {
        title: tables[i].title,
        data: nameData + '[' + i + ']',
        enableCellSelection: true,
        enableCellEdit: true,
        enableRowSelection: false,
        columnDefs: []
      };

      for(z=0,zLen=columns.length; z<zLen; z++) {
        var columnName = columns[z].ColTitle;
        columnName = removeSpaces(columnName);
        columnName = removeSpecialCharacters(columnName);
        item.columnDefs.push({
          field: columnName,
          displayName: columns[z].ColTitle
        });
      }

      grid.push(item);
    }

    return grid;
  }

  function getItem (row, columns) {
    var i;
    var item = {};

    for (i=0,len=row.length; i<len; i++) {
      if (columns[i]) {
        var columnName = columns[i].ColTitle;
        columnName = removeSpaces(columnName);
        columnName = removeSpecialCharacters(columnName);
        item[columnName] = row[i].value;
      }
    }

    return item;
  }

  function removeSpaces (value) {
    return value && typeof value === 'string' ? value.replace(/ +/g, '') : '';
  }

  function removeSpecialCharacters (value) {
    return value && typeof value === 'string' ? value.replace(/[^a-zA-Z ]/g, '') : '';
  }

  return {
    getDataToSendToServer: getDataToSendToServer,
    safeApply: safeApply,
    getDataBasedOnTableFormat: getDataBasedOnTableFormat,
    getGridasedOnTableFormat: getGridasedOnTableFormat
    // isLastItem: isLastItem,
    // getItem: getItem,
    // removeSpaces: removeSpaces,
    // removeSpecialCharacters: removeSpecialCharacters
  };
});