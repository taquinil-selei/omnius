﻿var AssociatedPageIds = [];

function SaveBlock(commitMessage) {
    resourceRulesArray = [];
    workflowRulesArray = [];
    portTargetsArray = [];
    saveId = 0;
    $("#resourceRulesPanel .resourceRule").each(function (ruleIndex, ruleDiv) {
        itemArray = [];
        connectionArray = [];
        currentRule = $(ruleDiv);
        currentRule.find(".item").each(function (itemIndex, itemDiv) {
            currentItem = $(itemDiv);
            currentItem.attr("saveId", saveId);
            saveId++;
            itemArray.push({
                Id: currentItem.attr("saveId"),
                Label: currentItem.text(),
                TypeClass: GetItemTypeClass(currentItem),
                PositionX: parseInt(currentItem.css("left")),
                PositionY: parseInt(currentItem.css("top")),
                ActionId: currentItem.attr("actionid"),
                PageId: currentItem.attr("pageId"),
                ComponentName: currentItem.attr("componentName"),
                TableName: currentItem.attr("tableName"),
                ColumnName: currentItem.attr("columnName"),
                ColumnFilter: currentItem.data("columnFilter"),
                ConditionSets: currentItem.data("conditionSets")
            });
        });
        currentInstance = currentRule.data("jsPlumbInstance");
        jsPlumbConnections = currentInstance.getAllConnections();
        for (i = 0; i < jsPlumbConnections.length; i++) {
            currentConnection = jsPlumbConnections[i];
            sourceDiv = $(currentConnection.source);
            targetDiv = $(currentConnection.target);
            connectionArray.push({
                SourceId: sourceDiv.attr("saveId"),
                SourceSlot: 0,
                TargetId: targetDiv.attr("saveId"),
                TargetSlot: 0
            });
        }
        resourceRulesArray.push({
            Id: ruleIndex,
            Width: parseInt(currentRule.css("width")),
            Height: parseInt(currentRule.css("height")),
            PositionX: parseInt(currentRule.css("left")),
            PositionY: parseInt(currentRule.css("top")),
            ResourceItems: itemArray,
            Connections: connectionArray
        });
    });
    $("#workflowRulesPanel .workflowRule").each(function (ruleIndex, ruleDiv) {
        swimlanesArray = [];
        currentRule = $(ruleDiv);
        currentRule.find(".swimlane").each(function (swimlaneIndex, swimlaneDiv) {
            currentSwimlane = $(swimlaneDiv);
            currentSwimlane.attr("swimlaneIndex", swimlaneIndex);
            rolesArray = [];
            itemArray = [];
            symbolArray = [];
            connectionArray = [];
            currentSwimlane.find(".swimlaneRolesArea .roleItem").each(function (roleIndex, roleDiv) {
                rolesArray.push($(roleDiv).text());
            });
            currentSwimlane.find(".item").each(function (itemIndex, itemDiv) {
                currentItem = $(itemDiv);
                currentItem.attr("saveId", saveId);
                saveId++;
                itemArray.push({
                    Id: currentItem.attr("saveId"),
                    Label: currentItem.find(".itemLabel").text(),
                    TypeClass: GetItemTypeClass(currentItem),
                    DialogType: currentItem.attr("dialogType"),
                    StateId: currentItem.attr("stateid"),
                    TargetId: currentItem.attr("targetid"), 
                    PositionX: parseInt(currentItem.css("left")),
                    PositionY: parseInt(currentItem.css("top")),
                    ActionId: currentItem.attr("actionid"),
                    InputVariables: currentItem.data("inputVariables"),
                    OutputVariables: currentItem.data("outputVariables"),
                    PageId: currentItem.attr("pageId"),
                    ComponentName: currentItem.attr("componentName"),
                    isAjaxAction: currentItem.data("isAjaxAction"),
                    Condition: currentItem.data("condition")
                });
            });
            swimlanesArray.push({
                SwimlaneIndex: swimlaneIndex,
                Height: parseInt(currentSwimlane.css("height")),
                Roles: rolesArray,
                WorkflowItems: itemArray,
                WorkflowSymbols: symbolArray
            });
        });
        currentInstance = currentRule.data("jsPlumbInstance");
        jsPlumbConnections = currentInstance.getAllConnections();
        for (i = 0; i < jsPlumbConnections.length; i++) {
            currentConnection = jsPlumbConnections[i];
            sourceDiv = $(currentConnection.source);
            targetDiv = $(currentConnection.target);
            sourceEndpointUuid = currentConnection.endpoints[0].getUuid();
            if (sourceEndpointUuid.match("BottomCenter$"))
                sourceSlot = 1;
            else
                sourceSlot = 0;
            if (!sourceDiv.hasClass("subSymbol")) {
                connectionArray.push({
                    SourceId: sourceDiv.attr("saveId"),
                    SourceSlot: sourceSlot,
                    TargetId: targetDiv.attr("saveId"),
                    TargetSlot: 0
                });
            }
        }
        workflowRulesArray.push({
            Id: ruleIndex,
            Name: currentRule.find(".workflowRuleHeader .verticalLabel").text(),
            Width: parseInt(currentRule.css("width")),
            Height: parseInt(currentRule.css("height")),
            PositionX: parseInt(currentRule.css("left")),
            PositionY: parseInt(currentRule.css("top")),
            Swimlanes: swimlanesArray,
            Connections: connectionArray
        });
    });
    postData = {
        CommitMessage: commitMessage,
        Name: $("#blockHeaderBlockName").text(),
        ResourceRules: resourceRulesArray,
        WorkflowRules: workflowRulesArray,
        PortTargets: portTargetsArray,
        AssociatedTableName: AssociatedTableName,
        AssociatedPageIds: AssociatedPageIds,
        AssociatedTableIds: AssociatedTableIds,
        RoleWhitelist: RoleWhitelist,
        ParentMetablockId: $("#parentMetablockId").val()
    }    
    appId = $("#currentAppId").val();
    blockId = $("#currentBlockId").val();
    $.ajax({
        type: "POST",
        url: "/api/tapestry/apps/" + appId + "/blocks/" + blockId,
        data: postData,
        success: function () {
            ChangedSinceLastSave = false;
            alert("OK");
        },
        error: function (request, status, error) {
            alert(request.responseText);
        }
    });
}
