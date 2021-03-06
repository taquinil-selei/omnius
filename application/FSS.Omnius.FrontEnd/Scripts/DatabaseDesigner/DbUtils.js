﻿function ClearDbScheme() {
    jQuery.each($("#database-container .dbTable"), function (i, val) {
        instance.removeAllEndpoints(val, true);
        val.remove();
    });
    jQuery.each($("#database-container .dbView"), function (i, val) {
        val.remove();
    });
};

function AddColumnToJsPlumb(item) {
    instance.makeSource(item, {
        anchor: ["Continuous", { faces: ["left", "right"] }],
        faces: ["left", "right"],
        container: "database-container",
        connector: ["Bezier", {curviness: 150}],
        connectorStyle: { strokeStyle: "#1092bd", lineWidth: 2, outlineColor: "transparent", outlineWidth: 4 }
    });

    instance.makeTarget(item, {
        dropOptions: { hoverClass: "dragHover" },
        anchor: ["Continuous", { faces: ["left", "right"] }],
        faces: ["left", "right"],
        container: "database-container",
        allowLoopback: false
    });
}

function EditRelation(connection, sourceLabel, targetLabel) {
    connection.removeOverlay("label0");
    connection.removeOverlay("label1");
    connection.addOverlay(["Label", {
        location: 0.1,
        id: "label0",
        cssClass: "relationLabel",
        label: sourceLabel
    }]);
    connection.addOverlay(["Label", {
        location: 0.9,
        id: "label1",
        cssClass: "relationLabel",
        label: targetLabel
    }]);
}

function AddTable(tableName) {
    var tableAllowed = true;
    $("#database-container .dbTable").each(function (tableIndex, tableDiv) {
        if ($(tableDiv).find(".dbTableName").text().toLowerCase() == tableName.toLowerCase()) {
            tableAllowed = false;
            alert("This table name is already used.");
            return false;
        }
       
        var regex = /^[0-9a-zA-Z_]+$/;
        if (!regex.test(tableName)) {
            tableAllowed = false;
            alert("Incorrect table name.");
            return false;
        }    
    });

    if (!tableAllowed) {
        return;
    }

    newTable = $('<div class="dbTable"><div class="dbTableHeader"><div class="deleteTableIcon fa fa-remove"></div><div class="dbTableName">'
        + tableName + '</div><div class="editTableIcon fa fa-pencil"></div><div class="addColumnIcon fa fa-plus"></div></div>'
        + '<div class="dbTableBody"><div class="dbColumn idColumn dbPrimaryKey" dbColumnType="integer">'
        + '<div class="dbColumnName">id</div></div></div>'
        + '<div class="dbTableIndexArea"></div></div>');
    newTable.find(".dbColumn").data("dbColumnType", "integer");
    $("#database-container").append(newTable);
    newTable.find(".editTableIcon").on("click", function () {
        CurrentTable = $(this).parents(".dbTable");
        editTableDialog.dialog("open");
    });
    newTable.find(".deleteTableIcon").on("click", function () {
        $(this).parents(".dbTable").remove();
        instance.removeAllEndpoints($(this).parents(".dbTable"), true);
    });
    newTable.find(".addColumnIcon").on("click", function () {
        addColumnDialog.data("currentTable", $(this).parents(".dbTable"));
        addColumnDialog.dialog("open");
    })
    instance.draggable(newTable);
    AddColumnToJsPlumb(newTable.find(".dbColumn"));
}

function AddColumn(table, columnName, type, isPrimaryKey, allowNull, defaultValue, length, lengthMax, unique, displayName) {
    newColumn = $('<div class="dbColumn"><div class="deleteColumnIcon fa fa-remove"></div><div class="dbColumnName">'
        + columnName + '</div><div class="editColumnIcon fa fa-pencil"></div></div>');

    newColumn.children(".deleteColumnIcon").on("mousedown", function () {
        $(this).parents(".dbColumn").remove();
        instance.removeAllEndpoints($(this).parents(".dbColumn"), true);
        instance.recalculateOffsets();
        instance.repaintEverything();
        return false;
    });
    newColumn.children(".editColumnIcon").on("mousedown", function () {
        CurrentColumn = $(this).parents(".dbColumn");
        editColumnDialog.dialog("open");
        return false;
    });
    table.children(".dbTableBody").append(newColumn);
    if (isPrimaryKey) {
        //table.find(".dbColumn").removeClass("dbPrimaryKey");
        newColumn.addClass("dbPrimaryKey");
    }
    newColumn.data("dbAllowNull", allowNull);
    newColumn.data("dbUnique", unique);
    newColumn.data("dbDefaultValue", defaultValue);
    newColumn.attr("dbColumnType", type);
    newColumn.data("dbColumnLength", length);
    newColumn.data("dbColumnLengthMax", lengthMax);
    newColumn.data("dbColumnDisplayName", displayName);
    AddColumnToJsPlumb(newColumn);
}

function AddIndex(table, name, indexColumnArray, unique) {
    indexLabel = "Index: ";
    for (i = 0; i < indexColumnArray.length - 1; i++)
        indexLabel += indexColumnArray[i] + ", ";
    indexLabel += indexColumnArray[indexColumnArray.length - 1];
    if (unique)
        indexLabel += " - unique";
    newIndex = $('<div class="dbIndex"><div class="deleteIndexIcon fa fa-remove"></div><div class="dbIndexText">' + indexLabel + '</div><div class="editIndexIcon fa fa-pencil"></div></div>');
    newIndex.data("indexName", name);
    filteredIndexColumnArray = [];
    for (i = 0; i < indexColumnArray.length; i++) {
        if (indexColumnArray[i] != "-none-")
            filteredIndexColumnArray.push(indexColumnArray[i]);
    }
    newIndex.data("indexColumnArray", filteredIndexColumnArray);
    newIndex.data("indexColumnArray", indexColumnArray);
    newIndex.data("unique", unique);
    newIndex.children(".deleteIndexIcon").on("mousedown", function () {
        $(this).parents(".dbIndex").remove();
        return false;
    });
    newIndex.children(".editIndexIcon").on("mousedown", function () {
        CurrentIndex = $(this).parents(".dbIndex");
        CurrentTable = $(this).parents(".dbTable");
        editIndexDialog.dialog("open");
        return false;
    });
    table.children(".dbTableIndexArea").append(newIndex);
}

function AddView(viewName, viewQuery) {
    newView = $('<div class="dbView" style="top: 100px; left: 20px;"><div class="dbViewHeader"><div class="deleteViewIcon fa fa-remove"></div>'
    + '<div class="dbViewName">View: ' + viewName + '</div><div class="editViewIcon fa fa-pencil"></div></div></div>');

    $("#database-container").append(newView);
    newView.find(".editViewIcon").on("click", function () {
        CurrentView = $(this).parents(".dbView");
        editViewDialog.dialog("open");
    });
    newView.find(".deleteViewIcon").on("click", function () {
        $(this).parents(".dbView").remove();
    });
    newView.data("dbViewName", viewName);
    newView.data("dbViewQuery", viewQuery);
    instance.draggable(newView);
}

function CheckColumnLengthSupport(dialog, typeCode) {
    // Check if data type supports column length
    currentType = SqlServerDataTypes.filter(function (val) {
        return val[0] == typeCode;
    });
    if (!typeCode) {
        dialog.find("#columnLengthNotSupported").show();
        dialog.find("#column-length").hide();
        dialog.find("#column-length-max").hide();
        dialog.find("label[for=column-length-max]").hide();
    } else if (currentType[0][2]) {
        dialog.find("#columnLengthNotSupported").hide();
        dialog.find("#column-length").show();
        dialog.find("#column-length-max").show();
        dialog.find("label[for=column-length-max]").show();
    } else {
        dialog.find("#columnLengthNotSupported").show();
        dialog.find("#column-length").hide();
        dialog.find("#column-length-max").hide();
        dialog.find("label[for=column-length-max]").hide();
    }
}
